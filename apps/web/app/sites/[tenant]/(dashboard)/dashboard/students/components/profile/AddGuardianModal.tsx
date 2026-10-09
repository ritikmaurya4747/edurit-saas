"use client";

import { useState } from "react";
import { Button, Checkbox, Field, Input, Modal, SearchInput, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { cn } from "@/lib/utils/cn";
import { RELATIONSHIP_OPTIONS, type ParentListItem } from "../../types";

type Mode = "new" | "existing";

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  occupation: "",
  relationship: "MOTHER",
  isPrimary: false,
  parentId: "",
};

const AddGuardianModal = ({ studentId, open, onClose }: { studentId: string; open: boolean; onClose: () => void }) => {
  const [mode, setMode] = useState<Mode>("new");
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounce(search.trim());

  const parents = usePaginatedQuery<ParentListItem>(
    ["students", "parents"],
    open && mode === "existing" && debounced.length >= 2 ? "parents" : null,
    { search: debounced, limit: 10 },
  );

  const close = () => {
    setForm(emptyForm);
    setSearch("");
    setMode("new");
    setError(null);
    onClose();
  };

  const save = useApiMutation(
    (f: typeof emptyForm) =>
      api.post(
        `students/${studentId}/guardians`,
        mode === "existing"
          ? { parentId: f.parentId, relationship: f.relationship, isPrimary: f.isPrimary }
          : {
              firstName: f.firstName,
              lastName: f.lastName || undefined,
              phone: f.phone,
              email: f.email || undefined,
              occupation: f.occupation || undefined,
              relationship: f.relationship,
              isPrimary: f.isPrimary,
            },
      ),
    { invalidate: [["students"]], success: "Guardian added", onSuccess: close },
  );

  const submit = () => {
    if (mode === "existing" && !form.parentId) return setError("Select a parent from the search results");
    if (mode === "new" && (form.phone.match(/\d/g) ?? []).length < 6) return setError("Enter a valid phone number");
    setError(null);
    save.mutate(form);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add Guardian"
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            Add guardian
          </Button>
        </>
      }
    >
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 p-0.5 text-xs font-bold">
        {(["new", "existing"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 cursor-pointer",
              mode === m ? "bg-[#1C263A] text-white" : "text-gray-600 hover:bg-gray-50",
            )}
          >
            {m === "new" ? "New contact" : "Existing parent (sibling)"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {mode === "new" ? (
          <>
            <Field label="First name" required className="col-span-2 sm:col-span-1">
              <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Last name" className="col-span-2 sm:col-span-1">
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
            <Field label="Phone" required className="col-span-2 sm:col-span-1">
              <Input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email" hint="Used for the parent's login" className="col-span-2 sm:col-span-1">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Occupation" className="col-span-2 sm:col-span-1">
              <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
            </Field>
          </>
        ) : (
          <div className="col-span-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search parent by name, email or phone…" />
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-100">
              {debounced.length < 2 ? (
                <p className="p-3 text-xs text-gray-400">Type at least 2 characters.</p>
              ) : parents.isLoading ? (
                <p className="p-3 text-xs text-gray-400">Searching…</p>
              ) : (parents.data?.data.length ?? 0) === 0 ? (
                <p className="p-3 text-xs text-gray-400">No parents found.</p>
              ) : (
                parents.data?.data.map((p) => (
                  <label
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 border-b border-gray-50 p-3 text-sm last:border-0 hover:bg-gray-50",
                      form.parentId === p.id && "bg-blue-50/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="parent"
                      className="mt-1 accent-[#1C263A]"
                      checked={form.parentId === p.id}
                      onChange={() => setForm({ ...form, parentId: p.id })}
                    />
                    <span>
                      <span className="font-bold text-gray-900">{p.name}</span>
                      <span className="block text-xs text-gray-500">
                        {[p.user.phone, p.user.email].filter(Boolean).join(" · ") || "No contact details"}
                      </span>
                      {p.children.length > 0 && (
                        <span className="block text-xs text-gray-400">
                          Children: {p.children.map((c) => c.name).join(", ")}
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
        <Field label="Relationship" required className="col-span-2 sm:col-span-1">
          <Select
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            options={RELATIONSHIP_OPTIONS}
          />
        </Field>
        <div className="col-span-2 flex items-center">
          <Checkbox
            label="Primary contact"
            checked={form.isPrimary}
            onChange={(isPrimary) => setForm({ ...form, isPrimary })}
          />
        </div>
      </div>
      {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
    </Modal>
  );
};

export default AddGuardianModal;
