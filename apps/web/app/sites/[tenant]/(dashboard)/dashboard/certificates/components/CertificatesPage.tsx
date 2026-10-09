"use client";

import { useState } from "react";
import { PageHeader, Tabs } from "@/components/ui";
import IdCardsTab from "./IdCardsTab";
import IssueTab from "./IssueTab";
import RegisterTab from "./RegisterTab";

type TabId = "issue" | "id-cards" | "register";

const CertificatesPage = () => {
  const [tab, setTab] = useState<TabId>("issue");
  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Certificates & ID Cards"
          description="Issue transfer, bonafide and character certificates, print student ID cards and keep a register"
        />
        <Tabs<TabId>
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "issue", label: "Issue Certificate" },
            { id: "id-cards", label: "ID Cards" },
            { id: "register", label: "Register" },
          ]}
        />
      </div>
      {tab === "issue" && <IssueTab />}
      {tab === "id-cards" && <IdCardsTab />}
      {tab === "register" && <RegisterTab onIssue={() => setTab("issue")} />}
    </div>
  );
};

export default CertificatesPage;
