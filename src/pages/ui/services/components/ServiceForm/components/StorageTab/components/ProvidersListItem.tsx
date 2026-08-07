import {
  MinioStorageProvider,
  StorageProvider,
} from "@/pages/ui/services/models/service";
import minioLogo from "@/assets/logos/minio.png";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface Props {
  provider: StorageProvider;
  setSelectedProvider: Dispatch<SetStateAction<StorageProvider | null>>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  onDelete: (id: string) => void;
}

function ProvidersListItem({
  provider,
  setSelectedProvider,
  setSelectedId,
  onDelete,
}: Props) {
  function getImage() {
    switch (provider.type) {
      case "minio":
        return minioLogo;
      default:
        return undefined;
    }
  }

  function getSubtitle() {
    switch (provider.type) {
      case "minio": {
        const minioProvider = provider as MinioStorageProvider;
        return minioProvider.endpoint;
      }
      default:
        return undefined;
    }
  }

  return (
    <div
      className="flex flex-grow flex-row items-center justify-start gap-4 max-w-[32.8%] h-[72px] rounded-lg border border-border bg-white py-2.5 pl-3.5 pr-2.5"
    >
      <img
        src={getImage()}
        alt="Provider logo"
        className="w-[30%]"
      />

      <div className="flex-grow basis-0 overflow-hidden">
        <h1 className="overflow-hidden whitespace-nowrap text-ellipsis">
          {provider.id}
        </h1>
        <h2 className="max-w-full overflow-hidden whitespace-nowrap text-ellipsis text-muted-foreground">
          {getSubtitle()}
        </h2>
      </div>
      <div>
        <Button
          id="edit-provider-button"
          style={{
            minWidth: 40,
            height: 40,
          }}
          size="icon"
          variant={"ghost"}
          onClick={() => {
            setSelectedProvider(provider);
            setSelectedId(provider.id);
          }}
        >
          <Edit />
        </Button>
        <Button
          id="delete-provider-button"
          style={{
            minWidth: 40,
            height: 40,
          }}
          size="icon"
          variant={"ghost"}
          onClick={() => {
            onDelete(provider.id);
          }}
        >
          <Trash2 className="text-oscar-red" />
        </Button>
      </div>
    </div>
  );
}

export default ProvidersListItem;
