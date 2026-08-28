import { DatabaseIcon } from "lucide-react";

const steps = [
  {
    title: "Run the schema",
    body: "Open the SQL Editor in your Supabase project and run supabase/schema.sql in full.",
  },
  {
    title: "Create an admin user",
    body: "Authentication → Users → Add user. Confirm the address so it can sign in straight away.",
  },
  {
    title: "Add your credentials",
    body: "Copy .env.example to .env.local, then fill in SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY from Project Settings → API.",
  },
  {
    title: "Restart the dev server",
    body: "Environment variables are read at startup, so the server needs a restart to pick them up.",
  },
];

export function SetupRequired() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
        <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <DatabaseIcon className="size-5" />
        </span>

        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          Connect your Supabase project
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          The app has no database credentials yet, so there is nothing to show.
          Four steps and you are done.
        </p>

        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
