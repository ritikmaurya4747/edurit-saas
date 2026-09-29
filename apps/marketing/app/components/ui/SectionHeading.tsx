import { cn } from "@/app/lib/utils";
import { Kicker } from "./Kicker";

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  dark,
  className,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}) {
  return (
    <div data-reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {kicker && <Kicker dark={dark}>{kicker}</Kicker>}
      <h2 className={cn("text-[2.1rem] leading-[1.08] sm:text-[2.6rem] md:text-[3.1rem]", dark && "text-white")}>{title}</h2>
      {description && (
        <p className={cn("mt-5 text-lg leading-relaxed", dark ? "text-white/65" : "text-ink-soft")}>{description}</p>
      )}
    </div>
  );
}
