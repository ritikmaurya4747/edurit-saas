"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import useCreateTenantMutation from "../hooks/useCreateTenantMutation";

const TenantsCreate = () => {
  const router = useRouter();
  const mutation = useCreateTenantMutation();

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    slug: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminInitialPassword: "",
    planCode: "FREE_TRIAL",
    currency: "INR",
    timezone: "Asia/Kolkata",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && {
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(result.message || "School provisioned successfully!");
          router.push("/dashboard");
        } else {
          toast.error(result.message || "Failed to provision school.");
        }
      },
      onError: () => {
        toast.error("Something went wrong. Please check your connection.");
      },
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provision New School</h1>
          <p className="text-sm text-gray-500 mt-1">Register a new tenant in the EduRit ecosystem.</p>
        </div>
        <Link
          href="/dashboard/tenants"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to List
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
        
        {/* Section 1: School Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">School Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Delhi Public School" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Legal Name</label>
              <input type="text" name="legalName" required value={formData.legalName} onChange={handleInputChange} placeholder="DPS Educational Society Reg." className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tenant Subdomain (Slug)</label>
              <div className="flex">
                <input type="text" name="slug" required value={formData.slug} onChange={handleInputChange} placeholder="dps-rk-puram" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-l-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending} />
                <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-gray-200 bg-gray-100 text-gray-500 text-sm font-medium">.edurit.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Admin Credentials */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Primary Admin Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" name="adminFirstName" required value={formData.adminFirstName} onChange={handleInputChange} placeholder="Amitabh" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" name="adminLastName" required value={formData.adminLastName} onChange={handleInputChange} placeholder="Verma" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Admin Email</label>
              <input type="email" name="adminEmail" required value={formData.adminEmail} onChange={handleInputChange} placeholder="principal@school.com" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Initial Password</label>
              <input type="text" name="adminInitialPassword" required minLength={6} value={formData.adminInitialPassword} onChange={handleInputChange} placeholder="Admin@123456" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending} />
            </div>
          </div>
        </div>

        {/* Section 3: Preferences & Billing */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Preferences & Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Subscription Plan</label>
              <select name="planCode" value={formData.planCode} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending}>
                <option value="FREE_TRIAL">Free Trial (14 Days)</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select name="currency" value={formData.currency} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <select name="timezone" value={formData.timezone} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1C263A] focus:border-[#1C263A] outline-none transition-all" disabled={mutation.isPending}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
          <button type="button" onClick={() => router.back()} disabled={mutation.isPending} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-60 cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className="px-5 py-2.5 text-sm font-medium text-white bg-[#1C263A] rounded-lg hover:bg-[#111827] focus:outline-none transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2 cursor-pointer">
            {mutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Provisioning...
              </>
            ) : (
              "Provision School"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantsCreate;