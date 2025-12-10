export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-extrabold mb-4 text-emerald-400 text-center">
        Congrats — You Joined the Crowd!
      </h1>
      <p className="text-zinc-300 max-w-md text-center mb-6">
        Your seats are locked in and your digital tickets are being generated.
        Check your wallet page to view them, or share the excitement with your friends.
      </p>
      <div className="flex gap-3">
        <a
          href="/wallet"
          className="px-4 py-2 rounded-md bg-emerald-500 text-black font-semibold"
        >
          Go to Wallet
        </a>
        <a
          href="/"
          className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-100"
        >
          Back to Home
        </a>
      </div>
    </main>
  );
}
