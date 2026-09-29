import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Kicker } from "./Kicker";
import { CampusLine } from "../illustrations/CampusLine";

/** Shared dark header for inner pages, matching the homepage hero. */
export function PageHero({
  kicker,
  title,
  description,
  cta = true,
}: {
  kicker: string;
  title: string;
  description: string;
  cta?: boolean;
}) {
  return <DarkHero kicker={kicker} title={title} description={description} cta={cta} />;
}

export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -left-[10%] -top-[30%] h-[60vh] w-[55vw] rounded-full bg-brand/35 blur-[120px] animate-aurora" />
      <div className="absolute -right-[10%] -top-[10%] h-[55vh] w-[45vw] rounded-full bg-accent/35 blur-[120px] animate-aurora-slow" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_50%_20%,black_15%,transparent_65%)]" />
    </div>
  );
}

function DarkHero({ kicker, title, description, cta }: { kicker: string; title: string; description: string; cta: boolean }) {
  return (
    <section className="grain relative isolate overflow-hidden bg-night text-white">
      <Aurora />
      <div className="container-content relative pt-36 text-center md:pt-44">
        <div className="animate-rise">
          <Kicker dark>{kicker}</Kicker>
        </div>
        <h1 className="mx-auto max-w-4xl animate-rise text-[2.6rem] leading-[1.04] [animation-delay:80ms] sm:text-[3.4rem] md:text-[4.2rem]">{title}</h1>
        <p className="mx-auto mt-6 max-w-2xl animate-rise text-lg leading-relaxed text-white/70 [animation-delay:160ms]">{description}</p>
        {cta && (
          <div className="mt-9 flex animate-rise justify-center [animation-delay:240ms]">
            <Link href="/demo" className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-semibold text-ink shadow-[0_0_0_6px_rgba(255,255,255,0.08),0_20px_50px_-12px_rgba(139,92,246,0.8)] transition-transform hover:-translate-y-0.5">
              Get started free
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-brand to-accent text-white">
                <ArrowRight size={15} aria-hidden />
              </span>
            </Link>
          </div>
        )}
      </div>
      <CampusLine id="page-cl" className="relative mt-8 block h-[110px] w-full md:h-[180px]" />
    </section>
  );
}
