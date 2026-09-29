import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trustLine } from "@/app/data/site";
import { CampusLine } from "../illustrations/CampusLine";

export function FinalCTA() {
  return (
    <section className="grain relative isolate overflow-hidden bg-night text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#24378E] via-[#2A2280] to-[#57198B] opacity-90" />
        <div className="absolute left-[10%] top-[10%] h-[50vh] w-[40vw] rounded-full bg-brand/40 blur-[120px] animate-aurora" />
        <div className="absolute right-[5%] top-[20%] h-[50vh] w-[40vw] rounded-full bg-[#DB2777]/30 blur-[120px] animate-aurora-slow" />
      </div>
      <div data-reveal className="container-content relative pb-6 pt-28 text-center md:pt-36">
        <h2 className="mx-auto max-w-4xl text-[2.6rem] leading-[1.04] sm:text-[3.4rem] md:text-[4.4rem]">
          Ready to transform <span className="text-gradient">your school?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/75">
          Join 500+ schools already using EduRit to streamline operations and improve student outcomes. Start your free 30-day trial today.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/demo" className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-semibold text-ink shadow-[0_0_0_6px_rgba(255,255,255,0.1),0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5">
            Start free trial
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-brand to-accent text-white transition-transform group-hover:translate-x-0.5">
              <ArrowRight size={15} aria-hidden />
            </span>
          </Link>
          <Link href="/demo" className="glass inline-flex items-center rounded-full px-7 py-4 font-semibold text-white hover:bg-white/[0.12]">
            Book a demo
          </Link>
        </div>
        <p className="mt-6 text-[0.88rem] text-white/60">{trustLine.join("  ·  ")}</p>
      </div>
      <CampusLine id="cta-cl" className="relative block h-[140px] w-full md:h-[230px]" />
    </section>
  );
}
