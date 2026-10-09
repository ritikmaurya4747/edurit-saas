import { Globe } from "lucide-react";
import { Badge } from "@/components/ui";
import { ONLINE_FORM_SOURCE, sourceLabel } from "../types";

// Enquiries from the public /apply form get a badge; other sources are plain text.
const SourceLabel = ({ source }: { source: string }) =>
  source === ONLINE_FORM_SOURCE ? (
    <Badge tone="blue" className="gap-1 px-1.5 py-0.5 text-[10px]">
      <Globe className="h-3 w-3" aria-hidden /> Online form
    </Badge>
  ) : (
    <>{sourceLabel(source)}</>
  );

export default SourceLabel;
