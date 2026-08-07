import { alert } from "@/lib/alert";
import { cn } from "@/lib/utils";
import { Copy, ExternalLink, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  label: string;
  value: string;
  isPassword?: boolean;
  enableCopy?: boolean;
  displayLabel?: boolean;
  link?: { url?: string, enableRedirectIcon: boolean };
  className?: string;
}

function InfoItem({
  label,
  value,
  isPassword = false,
  enableCopy = false,
  displayLabel = true,
  link = { enableRedirectIcon: false },
  className,
}: Props) {
  const [isRevealed, setIsRevealed] = useState(false);

  const displayedValue = useMemo(() => {
    if (!isPassword) return value;
    return isRevealed ? value : "**********************";
  }, [isRevealed, isPassword, value]);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    alert.success(label + " copied to clipboard");
  }

  return (
    <div className={cn("grid grid-cols-[1fr_auto] items-center justify-between gap-4 p-4", className)}>
      <h2 className="text-sm font-medium">
        {displayLabel ? label : ""}
      </h2>
      <div className="flex flex-row items-center gap-4 break-words text-right">
        <div className="min-w-0 break-all text-right text-sm font-medium">
          {!link.url ? displayedValue : (
            <Link className="no-underline" to={link.url} target="_blank">{displayedValue}</Link>
          )}
        </div>

        {isPassword && (
          <Eye
            size={16}
            className="flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsRevealed(!isRevealed);
            }}
          />
        )}
        {link.url && link.enableRedirectIcon && (
          <Link
            to={link.url}
            target="_blank"
          >
            <ExternalLink
              size={16}
              className="flex-shrink-0 cursor-pointer"
            />
          </Link>
        )}
        {enableCopy && (
          <Copy
            size={16}
            className={cn("flex-shrink-0 cursor-pointer", !isPassword && "mt-[3px]")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopy();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default InfoItem;
