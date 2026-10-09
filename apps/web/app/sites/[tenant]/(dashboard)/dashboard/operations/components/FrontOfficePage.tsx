"use client";

import { useState } from "react";
import { PageHeader, StatTile, Tabs } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import VisitorsTab from "./VisitorsTab";
import InfirmaryTab from "./InfirmaryTab";
import InventoryTab from "./InventoryTab";
import ComplianceTab from "./ComplianceTab";
import type { OperationsSummary } from "./types";

type TabId = "visitors" | "infirmary" | "inventory" | "compliance";

const FrontOfficePage = () => {
  const [tab, setTab] = useState<TabId>("visitors");
  const summary = useApiQuery<OperationsSummary>(["operations", "summary"], "operations/summary");
  const s = summary.data;
  const value = (n?: number) => (summary.isLoading ? "…" : summary.error ? "—" : (n ?? 0));

  return (
    <div>
      <PageHeader
        title="Front Office"
        description="Visitor register, infirmary log, stock and statutory compliance in one place"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Visitors inside" value={value(s?.visitorsInside)} hint="Not yet checked out" />
        <StatTile label="Visitors today" value={value(s?.visitorsToday)} hint="Checked in today" />
        <StatTile label="Infirmary today" value={value(s?.infirmaryToday)} hint="Student visits" />
        <StatTile
          label="Low stock items"
          value={value(s?.lowStockCount)}
          hint="At or below reorder level"
          tone={s?.lowStockCount ? "warning" : "default"}
        />
        <StatTile
          label="Compliance due soon"
          value={value(s?.complianceDueSoon)}
          hint="Within 30 days"
          tone={s?.complianceDueSoon ? "warning" : "default"}
        />
        <StatTile
          label="Compliance overdue"
          value={value(s?.complianceOverdue)}
          hint="Past due date"
          tone={s?.complianceOverdue ? "danger" : "success"}
        />
      </div>

      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "visitors", label: "Visitors", count: s?.visitorsInside || undefined },
          { id: "infirmary", label: "Infirmary" },
          { id: "inventory", label: "Inventory", count: s?.lowStockCount || undefined },
          { id: "compliance", label: "Compliance", count: s ? s.complianceOverdue + s.complianceDueSoon || undefined : undefined },
        ]}
      />

      {tab === "visitors" && <VisitorsTab />}
      {tab === "infirmary" && <InfirmaryTab />}
      {tab === "inventory" && <InventoryTab />}
      {tab === "compliance" && <ComplianceTab />}
    </div>
  );
};

export default FrontOfficePage;
