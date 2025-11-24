import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Emirates Academy Marketplace',
    version: '1.0.0',
  },
});

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

interface MarketplacePaymentRequest {
  firebase_buyer_uid: string;
  firebase_seller_uid: string;
  firebase_order_id: string;
  product_id: string;
  product_title: string;
  product_type: 'digital' | 'physical' | 'service';
  quantity: number;
  amount: number;
  currency: string;
  seller_email: string;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const {
      firebase_buyer_uid,
      firebase_seller_uid,
      firebase_order_id,
      product_id,
      product_title,
      product_type,
      quantity,
      amount,
      currency,
      seller_email
    }: MarketplacePaymentRequest = await req.json();

    if (!firebase_buyer_uid || !firebase_order_id || !product_id || !amount) {
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }

    console.log(`Processing marketplace payment for order: ${firebase_order_id}`);

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', firebase_buyer_uid)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Failed to fetch customer information', getCustomerError);
      return corsResponse({
        error: 'Failed to fetch customer information',
        details: getCustomerError.message
      }, 500);
    }

    let customerId: string;

    if (!customer || !customer.customer_id) {
      const newCustomer = await stripe.customers.create({
        metadata: {
          firebase_uid: firebase_buyer_uid,
          source: 'marketplace'
        },
      });

      console.log(`Created new Stripe customer ${newCustomer.id} for buyer ${firebase_buyer_uid}`);

      const { error: createCustomerError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: firebase_buyer_uid,
          customer_id: newCustomer.id,
        });

      if (createCustomerError) {
        console.error('Failed to save customer mapping', createCustomerError);
        try {
          await stripe.customers.del(newCustomer.id);
        } catch (deleteError) {
          console.error('Failed to cleanup customer:', deleteError);
        }
        return corsResponse({ error: 'Failed to create customer mapping' }, 500);
      }

      customerId = newCustomer.id;
    } else {
      customerId = customer.customer_id;
    }

    const amountInCents = Math.round(amount * 100);
    const currencyLower = currency.toLowerCase();

    const supportedCurrencies = ['usd', 'eur', 'gbp', 'aed', 'aud', 'cad', 'jpy', 'inr', 'sgd'];
    if (!supportedCurrencies.includes(currencyLower)) {
      return corsResponse({ error: `Currency ${currency} is not supported. Supported currencies: ${supportedCurrencies.join(', ')}` }, 400);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currencyLower,
      customer: customerId,
      metadata: {
        marketplace_order: 'true',
        firebase_order_id,
        firebase_buyer_uid,
        firebase_seller_uid,
        product_id,
        product_title,
        product_type,
        quantity: quantity.toString(),
        seller_email
      },
      description: `Marketplace: ${product_title} (${quantity}x)`,
      automatic_payment_methods: {
        enabled: true,
      },
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      setup_future_usage: 'off_session',
    });

    console.log(`Created payment intent ${paymentIntent.id} for order ${firebase_order_id}`);

    const { error: trackingError } = await supabase
      .from('marketplace_payment_intents')
      .insert({
        payment_intent_id: paymentIntent.id,
        firebase_order_id,
        firebase_buyer_uid,
        firebase_seller_uid,
        product_id,
        amount: amountInCents,
        currency: currency.toLowerCase(),
        status: 'pending',
        stripe_customer_id: customerId
      });

    if (trackingError) {
      console.error('Failed to track payment intent:', trackingError);
    }

    return corsResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId,
      currency: currencyLower,
      amount: amountInCents,
      requires3DSecure: paymentIntent.payment_method_options?.card?.request_three_d_secure === 'automatic'
    });

  } catch (error: any) {
    console.error(`Marketplace payment error: ${error.message}`, error);
    return corsResponse({ error: error.message }, 500);
  }
});
