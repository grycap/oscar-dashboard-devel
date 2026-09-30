import { Card, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

type ExpandCardProps = {
  title: string;
  className?: string;
  children: React.ReactNode;
  setExpandedState?: (expanded: boolean) => void;
  defaultExpanded?: boolean;
};

function ExpandCard({ title, className, children, setExpandedState, defaultExpanded = false }: ExpandCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  function toggleExpanded() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    setExpandedState?.(nextExpanded);
  }

  return (
    <Card className={className}>
      <CardTitle className="text-lg">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={toggleExpanded}
          className="flex w-full items-center justify-between rounded-md px-4 py-3 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-slate-800"
        >
          {title}
          {expanded ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
        </button>
      </CardTitle>
      {expanded && children}
    </Card>
  );
}

export default ExpandCard;
