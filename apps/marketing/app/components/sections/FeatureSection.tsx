import { FeatureSectionData } from "@/app/data/features";
import { mockById } from "../product/mockups";
import { Kicker } from "../ui/Kicker";
import { cn } from "@/app/lib/utils";


const backdrops = [
  "bg-teal-soft",
  "bg-accent-soft",
  "bg-sun-soft",
  "bg-meadow-soft",
  "bg-brand-soft",
];
const blobs = ["bg-sun", "bg-accent", "bg-brand", "bg-meadow-bright", "bg-teal"];

export function FeatureSection({ data, index }: { data: FeatureSectionData; index: number }) {
  const { eyebrow, title, description, bullets, align } = data;
  const reversed = align === "right";
  const Mock = mockById[data.id];

  return (
    <div id={data.id} className="scroll-mt-24 py-14 md:py-20">
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16 [&>*]:min-w-0",
          reversed && "lg:[&>*:first-child]:order-2"
        )}
      >
        <div>
          <Kicker>{eyebrow}</Kicker>
          <h3 className="text-[1.9rem] leading-[1.12] tracking-tight md:text-[2.4rem]">{title}</h3>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{description}</p>
          <ul className="mt-7 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3 text-[0.97rem]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-meadow-soft text-[11px] font-bold text-meadow">
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn("relative rounded-[32px] p-5 sm:p-8", backdrops[index % backdrops.length])}>
          <span
            aria-hidden
            className={cn(
              "absolute h-24 w-24 rounded-full opacity-90",
              blobs[index % blobs.length],
              reversed ? "-left-5 -top-5" : "-right-5 -top-5"
            )}
          />
          <div className="relative">{Mock && <Mock />}</div>
        </div>
      </div>
    </div>
  );
}
