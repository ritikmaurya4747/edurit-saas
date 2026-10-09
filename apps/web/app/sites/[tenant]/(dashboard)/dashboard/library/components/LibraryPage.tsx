"use client";

import { useState } from "react";
import { BookUp } from "lucide-react";
import { Button, PageHeader, StatTile, Tabs } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import CatalogueTab from "./CatalogueTab";
import IssuesTab from "./IssuesTab";
import IssueBookModal from "./IssueBookModal";
import type { Book, LibrarySummary } from "./types";

type TabId = "catalogue" | "issues";

const LibraryPage = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.LIBRARY_MANAGE);
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const [tab, setTab] = useState<TabId>("catalogue");
  // undefined = closed, null = open without a preselected book.
  const [issuing, setIssuing] = useState<Book | null | undefined>(undefined);

  const summary = useApiQuery<LibrarySummary>(["library", "summary"], "library/summary");
  const s = summary.data;
  const value = (n?: number) => (summary.isLoading ? "…" : summary.error ? "—" : formatNumber(n ?? 0));

  return (
    <div>
      <PageHeader
        title="Library"
        description="Catalogue, book issues and returns, with late fines worked out for you"
        actions={
          canManage ? (
            <Button onClick={() => setIssuing(null)}>
              <BookUp className="h-4 w-4" /> Issue book
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Titles" value={value(s?.titles)} hint="In the catalogue" />
        <StatTile
          label="Copies"
          value={value(s?.totalCopies)}
          hint={s ? `${formatNumber(s.availableCopies)} on the shelf` : undefined}
        />
        <StatTile label="Issued" value={value(s?.issued)} hint="Not yet returned" />
        <StatTile
          label="Overdue"
          value={value(s?.overdue)}
          hint="Past the due date"
          tone={s?.overdue ? "danger" : "success"}
        />
        <StatTile
          label="Fines pending"
          value={summary.isLoading ? "…" : summary.error ? "—" : formatCurrency(s?.finesPending ?? 0, currency)}
          hint={s ? `${formatCurrency(s.finePerDay, currency)} per day late, incl. running fines` : undefined}
          tone={s?.finesPending ? "warning" : "default"}
        />
      </div>

      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "catalogue", label: "Catalogue", count: s?.titles },
          { id: "issues", label: "Issued Books", count: s?.issued },
        ]}
      />

      {tab === "catalogue" && <CatalogueTab onIssue={(book) => setIssuing(book)} />}
      {tab === "issues" && <IssuesTab />}

      {issuing !== undefined && (
        <IssueBookModal
          book={issuing}
          maxBooksPerStudent={s?.maxBooksPerStudent}
          defaultLoanDays={s?.defaultLoanDays}
          onClose={() => setIssuing(undefined)}
          onIssued={() => setTab("issues")}
        />
      )}
    </div>
  );
};

export default LibraryPage;
