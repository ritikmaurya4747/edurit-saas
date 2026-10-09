"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { PROFILE_FIELDS, type SchoolProfile, type SchoolSettings } from "./types";

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <Card className="p-5">
    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
    {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </Card>
);

const LogoPreview = ({ url }: { url: string }) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const valid = !!url && isHttpUrl(url) && failedUrl !== url;
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      {valid ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="School logo preview" className="h-full w-full object-contain" onError={() => setFailedUrl(url)} />
      ) : (
        <ImageOff className="h-6 w-6 text-gray-300" />
      )}
    </div>
  );
};

const SchoolProfileTab = ({ data }: { data: SchoolSettings }) => {
  const router = useRouter();
  const can = useCan();
  const canEdit = can(PERMISSIONS.SETTINGS_MANAGE);

  const [name, setName] = useState(data.tenant.name);
  const [legalName, setLegalName] = useState(data.tenant.legalName ?? "");
  const [logoUrl, setLogoUrl] = useState(data.settings.logoUrl ?? "");
  const [profile, setProfile] = useState<SchoolProfile>(data.profile);

  const setField = (field: keyof SchoolProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProfile((p) => ({ ...p, [field]: e.target.value }));

  const logoError = logoUrl.trim() && !isHttpUrl(logoUrl.trim()) ? "Enter a full http(s) link to an image" : undefined;
  const yearError =
    profile.establishedYear.trim() && !/^\d{4}$/.test(profile.establishedYear.trim()) ? "Use a 4-digit year" : undefined;

  const save = useApiMutation(
    () =>
      api.patch<SchoolSettings>("settings/school", {
        name: name.trim(),
        legalName: legalName.trim(),
        logoUrl: logoUrl.trim(),
        profile: Object.fromEntries(PROFILE_FIELDS.map((f) => [f, profile[f].trim()])),
      }),
    {
      invalidate: [["settings"], ["dashboard"]],
      success: "School profile saved",
      onSuccess: () => router.refresh(),
    },
  );

  const disabled = !canEdit || save.isPending;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canEdit || logoError || yearError || !name.trim()) return;
        save.mutate();
      }}
    >
      {!canEdit && (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
          You can view the school profile. Only users with the &lsquo;Manage school settings&rsquo; permission can edit it.
        </p>
      )}

      <Section title="Identity" description="Shown in the dashboard header, receipts and report cards.">
        <Field label="School name" required>
          <Input required maxLength={255} value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} />
        </Field>
        <Field label="Legal / trust name" hint="As registered, for official documents">
          <Input maxLength={255} value={legalName} onChange={(e) => setLegalName(e.target.value)} disabled={disabled} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Logo URL" error={logoError} hint="Link to a square PNG/SVG image (http or https)">
            <div className="flex items-center gap-4">
              <LogoPreview url={logoUrl.trim()} />
              <Input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…/logo.png"
                disabled={disabled}
              />
            </div>
          </Field>
        </div>
        <Field label="Principal name">
          <Input maxLength={128} value={profile.principalName} onChange={setField("principalName")} disabled={disabled} />
        </Field>
        <Field label="Established year" error={yearError}>
          <Input
            inputMode="numeric"
            maxLength={4}
            value={profile.establishedYear}
            onChange={setField("establishedYear")}
            placeholder="1998"
            disabled={disabled}
          />
        </Field>
      </Section>

      <Section title="Address">
        <Field label="Street address" className="sm:col-span-2">
          <Textarea rows={2} maxLength={500} value={profile.address} onChange={setField("address")} disabled={disabled} />
        </Field>
        <Field label="City">
          <Input maxLength={128} value={profile.city} onChange={setField("city")} disabled={disabled} />
        </Field>
        <Field label="State">
          <Input maxLength={128} value={profile.state} onChange={setField("state")} disabled={disabled} />
        </Field>
        <Field label="PIN code">
          <Input maxLength={16} value={profile.pincode} onChange={setField("pincode")} disabled={disabled} />
        </Field>
      </Section>

      <Section title="Contact">
        <Field label="Phone">
          <Input type="tel" maxLength={32} value={profile.phone} onChange={setField("phone")} disabled={disabled} />
        </Field>
        <Field label="Email">
          <Input type="email" maxLength={255} value={profile.email} onChange={setField("email")} disabled={disabled} />
        </Field>
        <Field label="Website" className="sm:col-span-2">
          <Input maxLength={255} value={profile.website} onChange={setField("website")} placeholder="https://" disabled={disabled} />
        </Field>
      </Section>

      <Section title="Affiliation">
        <Field label="Board" hint="e.g. CBSE, ICSE, State Board, IB">
          <Input maxLength={64} value={profile.affiliationBoard} onChange={setField("affiliationBoard")} disabled={disabled} />
        </Field>
        <Field label="Affiliation number">
          <Input maxLength={64} value={profile.affiliationNumber} onChange={setField("affiliationNumber")} disabled={disabled} />
        </Field>
      </Section>

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" loading={save.isPending} disabled={!!logoError || !!yearError || !name.trim()}>
            Save profile
          </Button>
        </div>
      )}
    </form>
  );
};

export default SchoolProfileTab;
