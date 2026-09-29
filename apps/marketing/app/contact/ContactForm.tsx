"use client";

import { useState, type FormEvent } from "react";
import { Field, SelectField, TextArea, SubmitButton, FormSuccess } from "../components/ui/FormField";

const SUCCESS = {
  title: "Message sent",
  body: "Thanks for reaching out. Someone from our team will reply to the email you gave within one business day.",
};

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: send to your CRM or email service (e.g. a Route Handler in src/app/api/contact).
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
      <p className="font-display text-xl font-bold">Send us a message</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" required autoComplete="name" />
        <Field label="Work email" name="email" type="email" required autoComplete="email" />
        <Field label="School name" name="school" required autoComplete="organization" />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
        <SelectField className="sm:col-span-2" label="What can we help with?" name="topic" required options={["Pricing and plans", "Moving from another system", "Support for an existing account", "Partnerships", "Something else"]} />
      </div>
      <div className="mt-5">
        <TextArea label="Message" name="message" required placeholder="Tell us a little about your school and what you need." />
      </div>
      <SubmitButton>Send message</SubmitButton>
    </form>
  );
}
