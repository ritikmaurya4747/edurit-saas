"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@repo/ui";
import toast from "react-hot-toast";
import getTenants from "../../tenants/action/getTenants";

interface TenantSubscriptionPlan {
  name?: string;
}

interface TenantSubscription {
  plan?: TenantSubscriptionPlan;
}

interface TenantCounts {
  students?: number;
  staff?: number;
  branches?: number;
}

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  subscriptions?: TenantSubscription[];
  _count?: TenantCounts;
  [key: string]: unknown;
}

interface CellContext {
  row: {
    original: TenantItem;
  };
}

const Tenants = () => {
  const { data: tenants = [], isLoading, isError, error } = useQuery<TenantItem[]>({
    queryKey: ["platform-tenants"],
    queryFn: async () => {
      const result = await getTenants();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      toast.error(error instanceof Error ? error.message : "Failed to load schools list.");
    }
  }, [isError, error]);

  const columns = [
    {
      accessorKey: "name",
      header: "School Name",
      cell: ({ row }: CellContext) => (
        <div>
          <p className="font-semibold text-gray-900">{row.original.name}</p>
          <p className="text-xs text-gray-400">{row.original.slug}.edurit.com</p>
        </div>
      ),
    },
    {
      accessorKey: "legalName",
      header: "Legal Name",
    },
    {
      accessorKey: "subscriptions",
      header: "Plan",
      cell: ({ row }: CellContext) => {
        const sub = row.original.subscriptions?.[0];
        return (
          <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
            {sub?.plan?.name || "Free Trial"}
          </span>
        );
      },
    },
    {
      accessorKey: "_count",
      header: "Students / Staff",
      cell: ({ row }: CellContext) => (
        <span className="text-sm text-gray-600">
          {row.original._count?.students || 0} Students / {row.original._count?.staff || 0} Staff
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all registered platform tenants.</p>
        </div>
        <Link
          href="/dashboard/tenants/create"
          className="px-4 py-2 bg-[#1C263A] text-white text-sm font-medium rounded-lg hover:bg-[#111827] transition-colors shadow-sm"
        >
          + Add New School
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading schools data...</div>
      ) : isError ? (
        <div className="text-center py-12 text-red-500 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="font-medium">Failed to load schools.</p>
          <p className="text-xs text-gray-400 mt-1">Please check your network or re-login.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={tenants} />
      )}
    </div>
  );
};

export default Tenants;