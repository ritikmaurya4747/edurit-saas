"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Copy, ExternalLink, MessageCircle } from "lucide-react";
import { Button, Checkbox, Field, Input, Modal, QueryState, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useClasses } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import type { OnlineFormSettings } from "../types";

const MESSAGE_MAX = 1000;

// "Online form" settings: enable the public /apply page, its message and the
// classes offered, and share the link with parents.
const OnlineFormModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const settings = useApiQuery<OnlineFormSettings>(
    ["admissions", "online-form"],
    open ? "admissions/online-form/settings" : null,
  );
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Online admission form"
      description="Let parents send admission enquiries from a public link"
      size="lg"
    >
      <QueryState isLoading={settings.isLoading} error={settings.error} onRetry={() => settings.refetch()}>
        {settings.data && <SettingsForm key={settings.dataUpdatedAt} settings={settings.data} onClose={onClose} />}
      </QueryState>
    </Modal>
  );
};

const SettingsForm = ({ settings, onClose }: { settings: OnlineFormSettings; onClose: () => void }) => {
  const can = useCan();
  const canManage = can(PERMISSIONS.ADMISSIONS_MANAGE);
  const user = useUser();
  const classes = useClasses();

  const [enabled, setEnabled] = useState(settings.onlineFormEnabled);
  const [message, setMessage] = useState(settings.formMessage);
  const [yearLabel, setYearLabel] = useState(settings.academicYearLabel);
  const [allClasses, setAllClasses] = useState(settings.classesOpen.length === 0);
  const [selected, setSelected] = useState<string[]>(settings.classesOpen);

  // Class names are shared across branches; show each once, naturally sorted.
  const classNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const c of classes.data ?? []) {
      const name = c.name.trim();
      if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
    }
    return [...names.values()].sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
  }, [classes.data]);

  const isSelected = (name: string) => selected.some((s) => s.toLowerCase() === name.toLowerCase());
  const toggleClass = (name: string, checked: boolean) =>
    setSelected((list) => (checked ? [...list, name] : list.filter((s) => s.toLowerCase() !== name.toLowerCase())));

  const link = typeof window === "undefined" ? settings.publicPath : `${window.location.origin}${settings.publicPath}`;
  const schoolName = user?.tenantName || "our school";
  const shareText = `Admissions are open at ${schoolName}${yearLabel.trim() ? ` for ${yearLabel.trim()}` : ""}. Apply online: ${link}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  };

  const save = useApiMutation(
    () =>
      api.put<OnlineFormSettings>("admissions/online-form/settings", {
        onlineFormEnabled: enabled,
        formMessage: message.trim(),
        classesOpen: allClasses ? [] : selected,
        academicYearLabel: yearLabel.trim(),
      }),
    {
      invalidate: [["admissions", "online-form"]],
      success: (s) => (s.onlineFormEnabled ? "Online form is live" : "Online form turned off"),
      onSuccess: onClose,
    },
  );

  const noClassChosen = enabled && !allClasses && selected.length === 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (noClassChosen) {
          toast.error("Choose at least one class, or offer all classes");
          return;
        }
        save.mutate();
      }}
      className="space-y-5"
    >
      {/* Enable switch */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
        <div>
          <p className="text-sm font-bold text-gray-900">Accept online enquiries</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {enabled
              ? "Parents can fill the form; enquiries appear in the pipeline with an “Online form” badge."
              : "Parents opening the link see “Admissions are closed” with your school contact details."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Accept online enquiries"
          disabled={!canManage}
          onClick={() => setEnabled((v) => !v)}
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 cursor-pointer ${
            enabled ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5.5" : "translate-x-0.5"}`}
          />
        </button>
      </div>

      {/* Share link */}
      <div className="rounded-xl bg-gray-50 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6D839E]">Form link</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            aria-label="Online admission form link"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-800 outline-none"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1ebe5b]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
            </a>
            <a
              href={settings.publicPath}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the form in a new tab"
              title="Open the form"
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 text-gray-600 hover:bg-gray-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        {!settings.onlineFormEnabled && (
          <p className="mt-2 text-[11px] text-gray-500">Turn the form on and save before sharing the link.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Academic year label" hint="Shown on the form, e.g. 2026-27" className="sm:col-span-1">
          <Input
            value={yearLabel}
            maxLength={32}
            disabled={!canManage}
            onChange={(e) => setYearLabel(e.target.value)}
            placeholder="Current year"
          />
        </Field>
        <Field
          label="Message for parents"
          hint={`${message.length}/${MESSAGE_MAX} · shown above the form`}
          className="sm:col-span-2"
        >
          <Textarea
            rows={3}
            value={message}
            maxLength={MESSAGE_MAX}
            disabled={!canManage}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Admissions open for Nursery to Class 9. Our office will call you within 2 working days."
          />
        </Field>
      </div>

      {/* Classes offered */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Classes offered</p>
        <Checkbox
          label="All classes"
          checked={allClasses}
          disabled={!canManage}
          onChange={(checked) => {
            setAllClasses(checked);
            if (!checked && selected.length === 0) setSelected(classNames);
          }}
        />
        {!allClasses && (
          <div className="mt-3 rounded-xl border border-gray-200 p-3">
            {classes.isLoading ? (
              <p className="text-xs text-gray-400">Loading classes…</p>
            ) : classNames.length === 0 ? (
              <p className="text-xs text-gray-500">No classes yet. Add classes in Academics first.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {classNames.map((name) => (
                    <Checkbox
                      key={name}
                      label={name}
                      checked={isSelected(name)}
                      disabled={!canManage}
                      onChange={(checked) => toggleClass(name, checked)}
                    />
                  ))}
                </div>
                {canManage && (
                  <div className="mt-3 flex gap-3 border-t border-gray-100 pt-2 text-xs font-bold">
                    <button type="button" className="text-blue-700 hover:underline cursor-pointer" onClick={() => setSelected(classNames)}>
                      Select all
                    </button>
                    <button type="button" className="text-gray-500 hover:underline cursor-pointer" onClick={() => setSelected([])}>
                      Clear
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {noClassChosen && <p className="mt-1 text-xs text-red-600">Choose at least one class, or offer all classes.</p>}
      </div>

      <div className="-mx-5 flex justify-end gap-2 border-t border-gray-100 px-5 pt-3">
        <Button variant="secondary" onClick={onClose}>
          {canManage ? "Cancel" : "Close"}
        </Button>
        {canManage && (
          <Button type="submit" loading={save.isPending}>
            Save
          </Button>
        )}
      </div>
    </form>
  );
};

export default OnlineFormModal;
