import { alert } from "@/lib/alert";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import InfoItem from "./InfoItem";

interface Props {
  label: string;
  placeholder: string;
  values: string[];
  enableCopy?: boolean;
}

function InfoListItems({
  label,
  placeholder,
  values,
  enableCopy = false,
}: Props) {

  async function handleCopy() {
    await navigator.clipboard.writeText(values.toString());
    alert.success(label + " copied to clipboard");
  }

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-4 whitespace-pre-wrap p-4">
      <h2 className="text-sm font-medium">{label}</h2>
      <div className="flex flex-row items-center gap-4">
        <div className="max-w-[30vw] whitespace-pre-wrap break-words text-sm font-medium">
          <Select>
            <SelectTrigger className="border-transparent bg-transparent">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {values.map((item) => {
                return (
                  <InfoItem key={item} label={item} value={item} displayLabel={false} enableCopy />
                );
              })}
            </SelectContent>
          </Select>
        </div>
        {enableCopy && (
          <Copy
            size={16}
            className="mt-[3px] cursor-pointer"
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

export default InfoListItems;
