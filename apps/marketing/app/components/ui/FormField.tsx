import { cn } from "@/app/lib/utils";


const control =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  autoComplete,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <label className={cn("block text-[0.85rem] font-medium text-ink-soft", className)}>
      {label}
      {required && <span className="text-accent-deep"> *</span>}
      <input name={name} type={type} required={required} placeholder={placeholder} autoComplete={autoComplete} className={control} />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required,
  className,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block text-[0.85rem] font-medium text-ink-soft", className)}>
      {label}
      {required && <span className="text-accent-deep"> *</span>}
      <select name={name} required={required} defaultValue="" className={cn(control, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%2362748E%22 stroke-width=%222%22 fill=%22none%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10")}>
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function TextArea({ label, name, required, placeholder }: { label: string; name: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block text-[0.85rem] font-medium text-ink-soft">
      {label}
      {required && <span className="text-accent-deep"> *</span>}
      <textarea name={name} rows={4} required={required} placeholder={placeholder} className={control} />
    </label>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-medium text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.7)] transition-colors hover:from-brand-deep hover:to-accent-deep"
    >
      {children}
      <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">›</span>
    </button>
  );
}

export function FormSuccess({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="flex flex-col items-center rounded-[28px] bg-white p-10 text-center text-ink shadow-[0_30px_60px_-30px_rgba(15,23,43,0.45)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-meadow-soft text-2xl text-meadow">✓</span>
      <p className="mt-5 font-display text-2xl font-bold">{title}</p>
      <p className="mt-2 max-w-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
