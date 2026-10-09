"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import type { CollectTarget } from "../types";
import FeeHeader from "./FeeHeader";
import OverviewTab from "./OverviewTab";
import InvoicesTab from "./InvoicesTab";
import ReceiptsTab from "./ReceiptsTab";
import StructuresTab from "./StructuresTab";
import DefaultersTab from "./DefaultersTab";
import RefundsTab from "./RefundsTab";
import CollectPaymentModal from "./CollectPaymentModal";
import ReceiptModal from "./ReceiptModal";

type FeeTab = "overview" | "invoices" | "receipts" | "structures" | "defaulters" | "refunds";

const FeePage = () => {
  const can = useCan();
  const canCollect = can(PERMISSIONS.PAYMENT_COLLECT);
  const [tab, setTab] = useState<FeeTab>("overview");
  const [collect, setCollect] = useState<CollectTarget | null>(null);
  // Bumped on every open so the modal gets a fresh idempotency key.
  const [collectSession, setCollectSession] = useState(0);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const openCollect = canCollect
    ? (target: CollectTarget = {}) => {
        setCollectSession((n) => n + 1);
        setCollect(target);
      }
    : undefined;

  return (
    <div>
      <FeeHeader onCollectClick={openCollect && (() => openCollect())} />

      <Tabs<FeeTab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "invoices", label: "Invoices" },
          { id: "receipts", label: "Receipts" },
          { id: "structures", label: "Fee Structures" },
          { id: "defaulters", label: "Defaulters" },
          { id: "refunds", label: "Refunds" },
        ]}
      />

      {tab === "overview" && <OverviewTab onCollect={openCollect} onShowDefaulters={() => setTab("defaulters")} />}
      {tab === "invoices" && <InvoicesTab onCollect={openCollect} onViewReceipt={setReceiptId} />}
      {tab === "receipts" && <ReceiptsTab onViewReceipt={setReceiptId} />}
      {tab === "structures" && <StructuresTab />}
      {tab === "defaulters" && <DefaultersTab onCollect={openCollect} />}
      {tab === "refunds" && <RefundsTab onViewReceipt={setReceiptId} />}

      {collect && (
        <CollectPaymentModal
          key={collectSession}
          target={collect}
          onClose={() => setCollect(null)}
          onPaid={(paymentId) => {
            setCollect(null);
            setReceiptId(paymentId);
          }}
        />
      )}

      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />
    </div>
  );
};

export default FeePage;
