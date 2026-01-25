// components/VerifiedBadge.tsx
import { CheckCircle2, Clock3 } from "lucide-react";

type VerifiedBadgeProps = {
  status: "verified" | "pending";
};

export default function VerifiedBadge({ status }: VerifiedBadgeProps) {
  const isVerified = status === "verified";

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        isVerified
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      ].join(" ")}
    >
      {isVerified ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Verified to Source</span>
        </>
      ) : (
        <>
          <Clock3 className="h-3.5 w-3.5" />
          <span>Pending Verification</span>
        </>
      )}
    </div>
  );
}
