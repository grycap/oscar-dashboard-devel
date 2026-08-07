import { Check, X } from "lucide-react";

type Props = {
  label: string;
  enabled: boolean;
};

export default function InfoBooleanItem({ label, enabled }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{label}</span>
      {enabled ? (
        <Check size={16} className="mt-0.5 text-oscar-green-4" />
      ) : (
        <X size={16} className="mt-0.5 text-oscar-red" />
      )}
    </div>
  );
}
