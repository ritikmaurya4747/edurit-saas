import { Button } from "./components/ui/Button";

export default function NotFound() {
  return (
    <section className="container-content pb-28 pt-44 text-center">
      <h1 className="text-4xl tracking-tight">This page isn&rsquo;t on the timetable.</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
        The link may be old or mistyped. Head back to the homepage to find what you need.
      </p>
      <div className="mt-8">
        <Button href="/">Go to homepage</Button>
      </div>
    </section>
  );
}
