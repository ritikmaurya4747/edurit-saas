"use client";

import { useState } from "react";
import { Button, Checkbox, Field, Input, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useBranches } from "@/lib/api/lookups";
import { useUser } from "@/providers/user-provider";
import { toDateInput, todayInput } from "@/lib/utils/format";
import type { RoleOption, StaffCreateResult, StaffItem } from "../types";
import { STAFF_INVALIDATE } from "./shared";

// Used when GET /staff/roles is unavailable.
const FALLBACK_ROLES = [
  { value: "TEACHER", label: "Teacher" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "School Administrator" },
];

type StaffForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeCode: string;
  designation: string;
  department: string;
  joiningDate: string;
  basicSalary: string;
  isTeachingStaff: boolean;
  specialization: string;
  branchId: string;
  roleCode: string;
  password: string;
};

const fromStaff = (s: StaffItem | null): StaffForm => ({
  firstName: s?.firstName ?? "",
  lastName: s?.lastName ?? "",
  email: s?.email ?? "",
  phone: s?.phone ?? "",
  employeeCode: s?.employeeCode ?? "",
  designation: s?.designation ?? "",
  department: s?.department ?? "",
  joiningDate: s ? toDateInput(s.joiningDate) : todayInput(),
  basicSalary: s?.basicSalary != null ? String(Number(s.basicSalary)) : s ? "" : "0",
  isTeachingStaff: s?.isTeachingStaff ?? true,
  specialization: s?.specialization ?? "",
  branchId: s?.branch?.id ?? "",
  roleCode: s?.roles[0]?.code ?? "TEACHER",
  password: "",
});

interface Props {
  // null = create
  staff: StaffItem | null;
  onClose: () => void;
  onCreated?: (result: StaffCreateResult) => void;
}

// Mount only while open (`{open && <StaffFormModal … />}`) so the form resets.
export default function StaffFormModal({ staff, onClose, onCreated }: Props) {
  const user = useUser();
  const isEdit = !!staff;
  const [form, setForm] = useState<StaffForm>(() => fromStaff(staff));
  const set = <K extends keyof StaffForm>(key: K, value: StaffForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const branches = useBranches();
  const departments = useApiQuery<string[]>(["staff", "departments"], "staff/departments");
  const roles = useApiQuery<RoleOption[]>(["staff", "roles"], "staff/roles", undefined, { staleTime: 5 * 60_000 });
  const roleOptions = (roles.data?.length ? roles.data.map((r) => ({ value: r.code, label: r.name })) : FALLBACK_ROLES).filter(
    // Only administrators may hand out the administrator role.
    (r) => user?.isAdmin || r.value !== "ADMIN" || form.roleCode === "ADMIN",
  );

  const save = useApiMutation(
    async (f: StaffForm) => {
      const common = {
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim(),
        phone: f.phone.trim() || undefined,
        designation: f.designation.trim() || undefined,
        department: f.department.trim() || undefined,
        joiningDate: f.joiningDate || undefined,
        basicSalary: f.basicSalary === "" ? undefined : Number(f.basicSalary),
        isTeachingStaff: f.isTeachingStaff,
        specialization: f.specialization.trim() || undefined,
        branchId: f.branchId || undefined,
        employeeCode: f.employeeCode.trim() || undefined,
      };
      if (isEdit && staff) {
        const roleChanged = f.roleCode !== (staff.roles[0]?.code ?? "") || staff.roles.length > 1;
        return api.patch<StaffCreateResult>(`staff/${staff.id}`, {
          ...common,
          phone: f.phone.trim(),
          designation: f.designation.trim(),
          department: f.department.trim(),
          specialization: f.specialization.trim(),
          ...(roleChanged && f.roleCode && { roleCode: f.roleCode }),
        });
      }
      return api.post<StaffCreateResult>("staff", {
        ...common,
        email: f.email.trim().toLowerCase(),
        roleCode: f.roleCode,
        password: f.password || undefined,
      });
    },
    {
      invalidate: STAFF_INVALIDATE,
      success: (r) =>
        isEdit ? "Staff details updated" : r.existingAccount ? `${r.name} added (existing login linked)` : `${r.name} added to staff`,
      onSuccess: (r) => {
        onClose();
        if (!isEdit) onCreated?.(r);
      },
    },
  );

  const passwordTooShort = !isEdit && form.password.length > 0 && form.password.length < 8;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${staff?.name}` : "Add Staff Member"}
      description={isEdit ? undefined : "Creates the staff profile and a login for the ERP. A temporary password is generated if you leave it blank."}
      onSubmit={() => !passwordTooShort && save.mutate(form)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={passwordTooShort}>
            {isEdit ? "Save changes" : "Add staff"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Personal details</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <Input required maxLength={128} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Last name" required>
              <Input required maxLength={128} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
            <Field label="Email (login)" required hint={isEdit ? "The login email cannot be changed here" : undefined}>
              <Input
                type="email"
                required
                disabled={isEdit}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@school.edu"
              />
            </Field>
            <Field label="Phone">
              <Input type="tel" maxLength={32} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Job details</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Designation">
              <Input maxLength={128} value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Senior Teacher" />
            </Field>
            <Field label="Department">
              <Input
                maxLength={128}
                list="staff-departments"
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="Science"
              />
              <datalist id="staff-departments">
                {(departments.data ?? []).map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>
            <Field label="Employee code" hint={isEdit ? undefined : "Leave blank to auto-generate (EMP-0001…)"}>
              <Input maxLength={40} value={form.employeeCode} onChange={(e) => set("employeeCode", e.target.value)} placeholder="EMP-0001" />
            </Field>
            <Field label="Joining date">
              <Input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
            </Field>
            {(!isEdit || staff?.basicSalary != null) && (
              <Field label={`Basic salary / month (${user?.currency ?? "INR"})`}>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.basicSalary}
                  onChange={(e) => set("basicSalary", e.target.value)}
                />
              </Field>
            )}
            <Field label="Specialization">
              <Input maxLength={128} value={form.specialization} onChange={(e) => set("specialization", e.target.value)} placeholder="Physics" />
            </Field>
            <Field label="Branch">
              <Select
                value={form.branchId}
                onChange={(e) => set("branchId", e.target.value)}
                placeholder={isEdit ? undefined : "Default branch"}
                options={(branches.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
              />
            </Field>
            <Field label="Role (ERP access)" required>
              <Select required value={form.roleCode} onChange={(e) => set("roleCode", e.target.value)} options={roleOptions} />
            </Field>
            <div className="flex items-end pb-2 sm:col-span-2">
              <Checkbox
                label="Teaching staff (can be assigned classes and subjects)"
                checked={form.isTeachingStaff}
                onChange={(v) => set("isTeachingStaff", v)}
              />
            </div>
          </div>
        </section>

        {!isEdit && (
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Login</h4>
            <Field
              label="Initial password"
              hint="Optional, minimum 8 characters. Ignored if this email already has an EduRit login."
              error={passwordTooShort ? "Password must be at least 8 characters" : undefined}
            >
              <Input
                type="text"
                autoComplete="new-password"
                maxLength={128}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Leave blank to generate one"
              />
            </Field>
          </section>
        )}
      </div>
    </Modal>
  );
}
