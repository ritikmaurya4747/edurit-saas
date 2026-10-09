"use client";

import { useState } from "react";
import { PageHeader, QueryState, Tabs, type TabItem } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import AuditLogTab from "./AuditLogTab";
import MyAccountTab from "./MyAccountTab";
import RegionalTab from "./RegionalTab";
import SchoolProfileTab from "./SchoolProfileTab";
import SubscriptionTab from "./SubscriptionTab";
import { SETTINGS_KEY, type SchoolSettings } from "./types";

type TabId = "profile" | "regional" | "subscription" | "account" | "audit";

const SettingsPage = () => {
  const can = useCan();
  const canAudit = can(PERMISSIONS.AUDIT_READ);
  const [tab, setTab] = useState<TabId>("profile");
  const school = useApiQuery<SchoolSettings>([...SETTINGS_KEY], "settings/school");

  const tabs: TabItem<TabId>[] = [
    { id: "profile", label: "School Profile" },
    { id: "regional", label: "Regional" },
    { id: "subscription", label: "Subscription" },
    { id: "account", label: "My Account" },
    ...(canAudit ? [{ id: "audit" as const, label: "Audit Log" }] : []),
  ];

  const needsSchool = tab === "profile" || tab === "regional" || tab === "subscription";

  return (
    <div>
      <PageHeader title="Settings" description="School profile, regional preferences, subscription and your account" />

      <Tabs<TabId> tabs={tabs} active={tab} onChange={setTab} />

      {needsSchool && (
        <QueryState isLoading={school.isLoading} error={school.error} onRetry={() => school.refetch()}>
          {school.data && (
            <>
              {/* Keyed by updated values so forms re-initialise after a save. */}
              {tab === "profile" && (
                <SchoolProfileTab key={JSON.stringify([school.data.tenant, school.data.profile, school.data.settings.logoUrl])} data={school.data} />
              )}
              {tab === "regional" && (
                <RegionalTab key={`${school.data.settings.currency}-${school.data.settings.timezone}`} data={school.data} />
              )}
              {tab === "subscription" && <SubscriptionTab data={school.data} />}
            </>
          )}
        </QueryState>
      )}
      {tab === "account" && <MyAccountTab />}
      {tab === "audit" && canAudit && <AuditLogTab />}
    </div>
  );
};

export default SettingsPage;
