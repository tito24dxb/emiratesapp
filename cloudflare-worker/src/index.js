export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (url.pathname === '/api/openai' && request.method === 'POST') {
      try {
        if (!env.OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'OpenAI API key not configured' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const body = await request.json();
        const { messages, context } = body;

        if (!messages || !Array.isArray(messages)) {
          return new Response(
            JSON.stringify({ error: 'Invalid request: messages array required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error('OpenAI API Error:', errorText);
          return new Response(
            JSON.stringify({
              error: 'OpenAI API error',
              details: errorText
            }),
            {
              status: openaiResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        ctx.waitUntil(
          (async () => {
            try {
              const reader = openaiResponse.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              let totalTokens = 0;

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed === 'data: [DONE]') continue;

                  if (trimmed.startsWith('data: ')) {
                    try {
                      const jsonData = JSON.parse(trimmed.slice(6));
                      const content = jsonData.choices?.[0]?.delta?.content;

                      if (content) {
                        await writer.write(
                          encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                        );
                      }

                      if (jsonData.usage?.total_tokens) {
                        totalTokens = jsonData.usage.total_tokens;
                      }
                    } catch (e) {
                      console.error('Parse error:', e);
                    }
                  }
                }
              }

              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ done: true, totalTokens })}\n\n`)
              );
              await writer.close();
            } catch (error) {
              console.error('Stream error:', error);
              await writer.abort(error);
            }
          })()
        );

        return new Response(readable, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });

      } catch (error) {
        console.error('Worker error:', error);
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            message: error.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });
  },
};
