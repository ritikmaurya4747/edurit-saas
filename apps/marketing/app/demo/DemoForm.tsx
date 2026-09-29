"use client";

import { useState, type FormEvent } from "react";
import { Field, SelectField, SubmitButton, FormSuccess } from "../components/ui/FormField";

const SUCCESS = {
  title: "Request received",
  body: "We'll email you a few time slots for your walkthrough within one business day.",
};

export function DemoForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: send to your CRM or scheduling tool.
    setSubmitted(true);
  }

  if (submitted) return <FormSuccess {...SUCCESS} />;

  return (
    <form
      onSubmit={handleSubmit}
      data-success-title={SUCCESS.title}
      data-success-body={SUCCESS.body}
      className="rounded-[28px] bg-white p-7 text-ink shadow-[0_30px_60px_-30px_rgba(15,23,43,0.45)] md:p-9"
    >
      <p className="font-display text-xl font-bold">Book your walkthrough</p>
      <p className="mt-1 text-[0.9rem] text-ink-faint">Takes under a minute. No card required.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" required autoComplete="name" />
        <SelectField label="Your role" name="role" required options={["Principal / head of school", "Management / trustee", "Administrator / office", "Teacher", "IT / operations", "Other"]} />
        <Field className="sm:col-span-2" label="School name" name="school" required autoComplete="organization" />
        <Field label="Work email" name="email" type="email" required autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
        <SelectField label="Number of students" name="students" required options={["Under 100", "100–500", "500–1,000", "1,000+", "Several schools"]} />
        <SelectField label="What do you use today?" name="current" options={["Paper and spreadsheets", "Another school software", "A mix of both"]} />
      </div>
      <SubmitButton>Request a demo</SubmitButton>
      <p className="mt-4 text-center text-[0.8rem] text-ink-faint">We&rsquo;ll only use your details to arrange the demo.</p>
    </form>
  );
}
