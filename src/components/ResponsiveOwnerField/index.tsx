import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { cn, isUserOscar } from "@/lib/utils";
import { Copy } from "lucide-react";

export default function ResponsiveOwnerField({ owner, sub = owner, copy = true }: { owner: string, sub?: string, copy?: boolean }) {
  const {authData} = useAuth();
  const isCurrentUser = sub === authData.egiSession?.sub || isUserOscar(authData, {owner: sub});
  return (
    <div
      className={cn("grid grid-cols-[auto_1fr] items-center gap-1 no-underline underline-offset-2 cursor-pointer", copy && "hover:underline")}
      onClick={() => { if (copy) { navigator.clipboard.writeText(sub ? sub : "oscar"); alert.success("Owner copied to clipboard"); } }}
    >
      <span className="min-w-0 truncate">
        {isCurrentUser ? "You" : owner}
      </span>
      {copy && <Copy size={12} className="shrink-0" />}
  </div>
  )
  
}
