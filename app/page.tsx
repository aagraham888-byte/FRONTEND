export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-4">TicketFanGrub</h1>
      <p className="text-zinc-400 mb-8">
        Demo frontend — start at /events/demo-event
      </p>
      <a
        href="/events/demo-event"
        className="px-4 py-2 rounded-md bg-emerald-500 text-black font-semibold"
      >
        Go to Demo Event
      </a>
    </main>
  );
}
