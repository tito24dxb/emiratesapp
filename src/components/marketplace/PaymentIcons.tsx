export function ApplePayIcon({ className = "h-8" }: { className?: string }) {
  return (
    <img
      src="/096937064f1c19e885c46069db0c497c.jpg"
      alt="Apple Pay"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

export function GooglePayIcon({ className = "h-8" }: { className?: string }) {
  return (
    <img
      src="/white-google-pay-logotype-on-light-blue-background-logo-mobile-payment-system-electronic-wallet-contactless-nfc-for-android-operating-system-gpay-editorial-free-vector.jpg"
      alt="Google Pay"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

export function PaymentIconsDisplay() {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors">
        <ApplePayIcon className="w-10 h-6" />
      </div>
      <div className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
        <GooglePayIcon className="w-10 h-6" />
      </div>
    </div>
  );
}
