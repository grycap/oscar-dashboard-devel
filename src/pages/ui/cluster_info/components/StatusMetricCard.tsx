import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

type StatusMetricCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  percentage?: number;
  warning?: boolean;
};

function StatusMetricCard({ icon, label, value, detail, percentage, warning = false }: StatusMetricCardProps) {
  return (
    <Card className="h-full min-w-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="shrink-0 text-slate-900 dark:text-slate-50">{icon}</span>
            <span className="min-w-0 break-words">{label}</span>
          </div>
          {percentage !== undefined && (
            <Badge variant={warning ? "destructive" : "secondary"} className="shrink-0">
              {percentage}% used
            </Badge>
          )}
        </div>
        <div className={`mt-3 break-words text-xl font-semibold ${warning && percentage === undefined ? "text-red-600 dark:text-red-400" : "text-slate-950 dark:text-slate-50"}`}>{value}</div>
        {detail !== undefined && (
          <div className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{detail}</div>
        )}
        {percentage !== undefined && (
          <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-2 rounded-full ${warning ? "bg-red-500" : "bg-[#009688]"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatusMetricCard;
