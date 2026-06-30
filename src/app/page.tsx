import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <p className="text-lg font-semibold">Group Project Manager</p>
          <p className="text-sm text-slate-400">
            Keep your team aligned and moving forward.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton />
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </nav>

      <section className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-20">
        <span className="w-fit rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-sm text-slate-300">
          Authenticated workflows for modern teams
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Plan projects, assign work, and ship with confidence.
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Sign up to create your first workspace, invite teammates, and keep
            every milestone visible.
          </p>
        </div>
      </section>
    </main>
  );
}
