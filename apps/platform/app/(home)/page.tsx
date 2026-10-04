import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-2xl font-bold text-white shadow-lg">
            E
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            EduRit
          </h1>

          <p className="mt-3 text-base leading-7 text-zinc-500">
            Smart school management, simplified.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">
            Welcome to EduRit
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Manage your school, academics, students and operations from one
            place.
          </p>

          <Link
            href="/login"
            className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Login to Dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-400">
          © {new Date().getFullYear()} EduRit. All rights reserved.
        </p>
      </div>
    </main>
  );
}