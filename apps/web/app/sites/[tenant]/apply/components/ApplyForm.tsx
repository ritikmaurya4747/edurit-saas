"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Copy, Info } from "lucide-react";
import { submitAdmissionEnquiry } from "../actions";
import { formatMobile, MAX_LENGTH, normaliseMobile, type EnquiryInput } from "../types";

type Errors = Partial<Record<keyof EnquiryInput, string>>;

const EMPTY: EnquiryInput = {
  studentName: "",
  dob: "",
  gender: "",
  classApplied: "",
  parentName: "",
  phone: "",
  email: "",
  address: "",
  previousSchool: "",
  notes: "",
  website: "",
};

const GENDERS = [
  { value: "MALE", label: "Boy" },
  { value: "FEMALE", label: "Girl" },
  { value: "OTHER", label: "Other" },
];

// Letters of any script, spaces, dots, apostrophes, hyphens (same rule as the API).
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// "2026-10-09" shifted by whole years (Feb 29 → Feb 28).
const shiftYears = (ymd: string, years: number) => {
  const [y = "2000", m = "01", d = "01"] = ymd.split("-");
  const day = m === "02" && d === "29" ? "28" : d;
  return `${Number(y) + years}-${m}-${day}`;
};

function validateName(value: string, who: string, max: number) {
  const v = value.trim().replace(/\s+/g, " ");
  if (!v) return `Please enter the ${who}'s name`;
  if (v.length < 2) return `The ${who}'s name is too short`;
  if (v.length > max) return `Please keep the name under ${max} characters`;
  if (!PERSON_NAME.test(v)) return "Use letters, spaces, dots and hyphens only";
  return undefined;
}

function validate(form: EnquiryInput, classes: string[], minDob: string, maxDob: string): Errors {
  const errors: Errors = {};
  errors.studentName = validateName(form.studentName, "student", MAX_LENGTH.studentName);
  if (!form.dob) errors.dob = "Please enter the date of birth";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dob) || form.dob < minDob || form.dob > maxDob)
    errors.dob = "Please check the date of birth";
  if (!form.gender) errors.gender = "Please select one";
  if (!form.classApplied || !classes.includes(form.classApplied)) errors.classApplied = "Please select the class";
  errors.parentName = validateName(form.parentName, "parent", MAX_LENGTH.parentName);
  const phone = normaliseMobile(form.phone);
  if (!phone) errors.phone = "Please enter a mobile number";
  else if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Enter a valid 10-digit mobile number";
  if (form.email.trim() && (!EMAIL.test(form.email.trim()) || form.email.trim().length > MAX_LENGTH.email))
    errors.email = "Please enter a valid email address";
  if (form.address.length > MAX_LENGTH.address) errors.address = `Please keep it under ${MAX_LENGTH.address} characters`;
  if (form.previousSchool.length > MAX_LENGTH.previousSchool)
    errors.previousSchool = `Please keep it under ${MAX_LENGTH.previousSchool} characters`;
  if (form.notes.length > MAX_LENGTH.notes) errors.notes = `Please keep it under ${MAX_LENGTH.notes} characters`;
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Errors;
}

const inputClass = (error?: string) =>
  `w-full rounded-xl border-[1.5px] bg-white px-4 py-2.5 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 disabled:bg-slate-50 disabled:opacity-70 sm:text-sm ${
    error ? "border-red-400" : "border-slate-200"
  }`;

function FormField({
  id,
  label,
  required,
  hint,
  error,
  className = "",
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : <span className="font-normal text-slate-400"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

interface ApplyFormProps {
  slug: string;
  schoolName: string;
  classes: string[];
  message: string | null;
  today: string;
}

export default function ApplyForm({ slug, schoolName, classes, message, today }: ApplyFormProps) {
  const [form, setForm] = useState<EnquiryInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState<{ reference: string; phone: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const minDob = shiftYears(today, -25);
  const maxDob = shiftYears(today, -1);

  const set = <K extends keyof EnquiryInput>(key: K, value: EnquiryInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const fieldProps = (key: keyof EnquiryInput) => ({
    id: `apply-${key}`,
    name: key,
    disabled: isPending,
    "aria-invalid": !!errors[key] || undefined,
    "aria-describedby": errors[key] ? `apply-${key}-error` : undefined,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    const found = validate(form, classes, minDob, maxDob);
    setErrors(found);
    setServerError("");
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`apply-${first}`)?.focus();
      return;
    }

    const phone = normaliseMobile(form.phone);
    startTransition(async () => {
      const result = await submitAdmissionEnquiry(slug, {
        ...form,
        studentName: form.studentName.trim().replace(/\s+/g, " "),
        parentName: form.parentName.trim().replace(/\s+/g, " "),
        phone,
        email: form.email.trim(),
      });
      if (result.ok) {
        setSubmitted({ reference: result.reference, phone });
        setForm(EMPTY);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setServerError(result.message);
      }
    });
  };

  if (submitted) {
    return <SuccessCard schoolName={schoolName} {...submitted} onAnother={() => setSubmitted(null)} />;
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl">Admission enquiry form</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the details below and the {schoolName} admissions office will get in touch with you.
        </p>
      </div>

      {message && (
        <div className="mb-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
          <p className="whitespace-pre-line">{message}</p>
        </div>
      )}

      {serverError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="space-y-6">
        <Section title="Student details">
          <FormField id="apply-studentName" label="Student's full name" required error={errors.studentName} className="sm:col-span-2">
            <input
              {...fieldProps("studentName")}
              type="text"
              autoComplete="off"
              maxLength={MAX_LENGTH.studentName}
              value={form.studentName}
              onChange={(e) => set("studentName", e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className={inputClass(errors.studentName)}
            />
          </FormField>

          <FormField id="apply-dob" label="Date of birth" required error={errors.dob}>
            <input
              {...fieldProps("dob")}
              type="date"
              min={minDob}
              max={maxDob}
              value={form.dob}
              onChange={(e) => set("dob", e.target.value)}
              className={inputClass(errors.dob)}
            />
          </FormField>

          <FormField id="apply-classApplied" label="Admission sought for" required error={errors.classApplied}>
            <select
              {...fieldProps("classApplied")}
              value={form.classApplied}
              onChange={(e) => set("classApplied", e.target.value)}
              className={`${inputClass(errors.classApplied)} cursor-pointer`}
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <span id="apply-gender-label" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Gender<span className="text-red-500"> *</span>
            </span>
            <div role="radiogroup" aria-labelledby="apply-gender-label" className="grid grid-cols-3 gap-2 sm:max-w-sm">
              {GENDERS.map((g, i) => {
                const active = form.gender === g.value;
                return (
                  <button
                    key={g.value}
                    id={i === 0 ? "apply-gender" : undefined}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isPending}
                    onClick={() => set("gender", g.value)}
                    className={`rounded-xl border-[1.5px] px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-70 ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : `${errors.gender ? "border-red-400" : "border-slate-200"} bg-white text-slate-600 hover:border-slate-300`
                    } cursor-pointer`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
            {errors.gender && <p className="mt-1 text-xs font-medium text-red-600">{errors.gender}</p>}
          </div>
        </Section>

        <Section title="Parent / guardian details">
          <FormField id="apply-parentName" label="Parent's full name" required error={errors.parentName} className="sm:col-span-2">
            <input
              {...fieldProps("parentName")}
              type="text"
              autoComplete="name"
              maxLength={MAX_LENGTH.parentName}
              value={form.parentName}
              onChange={(e) => set("parentName", e.target.value)}
              placeholder="e.g. Rakesh Sharma"
              className={inputClass(errors.parentName)}
            />
          </FormField>

          <FormField
            id="apply-phone"
            label="Mobile number"
            required
            hint="The school will call or WhatsApp you on this number"
            error={errors.phone}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500 sm:text-sm">
                +91
              </span>
              <input
                {...fieldProps("phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                maxLength={16}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/[^\d\s+()-]/g, ""))}
                placeholder="98765 43210"
                className={`${inputClass(errors.phone)} pl-13`}
              />
            </div>
          </FormField>

          <FormField id="apply-email" label="Email" error={errors.email}>
            <input
              {...fieldProps("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={MAX_LENGTH.email}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              className={inputClass(errors.email)}
            />
          </FormField>
        </Section>

        <Section title="Other details">
          <FormField id="apply-address" label="Residential address" error={errors.address} className="sm:col-span-2">
            <textarea
              {...fieldProps("address")}
              rows={2}
              autoComplete="street-address"
              maxLength={MAX_LENGTH.address}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={`${inputClass(errors.address)} resize-y`}
            />
          </FormField>

          <FormField id="apply-previousSchool" label="Previous school" error={errors.previousSchool} className="sm:col-span-2">
            <input
              {...fieldProps("previousSchool")}
              type="text"
              autoComplete="off"
              maxLength={MAX_LENGTH.previousSchool}
              value={form.previousSchool}
              onChange={(e) => set("previousSchool", e.target.value)}
              placeholder="If the child studied elsewhere"
              className={inputClass(errors.previousSchool)}
            />
          </FormField>

          <FormField
            id="apply-notes"
            label="Questions or message for the school"
            error={errors.notes}
            hint={`${form.notes.length}/${MAX_LENGTH.notes}`}
            className="sm:col-span-2"
          >
            <textarea
              {...fieldProps("notes")}
              rows={3}
              maxLength={MAX_LENGTH.notes}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. need school transport, sibling already studying here…"
              className={`${inputClass(errors.notes)} resize-y`}
            />
          </FormField>
        </Section>
      </div>

      {/* Spam trap: invisible to people, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="apply-website">Website</label>
        <input
          id="apply-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all ${
          isPending
            ? "cursor-not-allowed bg-slate-400"
            : "cursor-pointer bg-linear-to-r from-blue-600 to-purple-600 shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:opacity-95"
        }`}
      >
        {isPending && (
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {isPending ? "Submitting…" : "Submit enquiry"}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Submitting this form does not confirm admission. The school will contact you with the next steps.
      </p>
    </form>
  );
}

function SuccessCard({
  schoolName,
  reference,
  phone,
  onAnother,
}: {
  schoolName: string;
  reference: string;
  phone: string;
  onAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the reference is on screen to note down.
    }
  };

  return (
    <section
      role="status"
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-900/5 sm:p-10"
    >
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden />
      <h2 className="mt-4 text-xl font-extrabold text-slate-800 sm:text-2xl">Enquiry submitted!</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Thank you for your interest in {schoolName}. Please note your reference number.
      </p>

      <div className="mx-auto mt-6 max-w-xs rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Reference number</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="font-mono text-2xl font-extrabold tracking-wider text-blue-900">{reference}</span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy reference number"
            className="cursor-pointer rounded-md p-1.5 text-blue-600 hover:bg-blue-100"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        {copied && <p className="mt-1 text-xs font-semibold text-emerald-600">Copied</p>}
      </div>

      <p className="mx-auto mt-6 max-w-md text-sm font-semibold text-slate-700">
        The school will contact you on {formatMobile(phone)}.
      </p>

      <button
        type="button"
        onClick={onAnother}
        className="mt-8 cursor-pointer rounded-xl border-[1.5px] border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Submit another enquiry
      </button>
    </section>
  );
}
