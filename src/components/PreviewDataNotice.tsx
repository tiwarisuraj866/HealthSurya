import { Info } from "lucide-react";
import { previewListingsEnabled } from "@/lib/demo-listings";

/** Shown while sample Jaunpur/Thane listings are enabled for pre-launch testing */
export function PreviewDataNotice() {
  if (!previewListingsEnabled()) return null;

  return (
    <div className="mb-4 flex gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>
        <span className="font-medium text-foreground">Sample listings for preview.</span>{" "}
        Demo doctors and labs (Jaunpur & Thane) will be removed by admin before public launch.
      </p>
    </div>
  );
}
