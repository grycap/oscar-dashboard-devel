import UserInfo from "@/components/UserInfo";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import AnimatedRefreshCw from "../ui/animatedRefreshCw";

interface GenericTopbarProps {
    customHeader?: React.ReactNode;
    defaultHeader?: {title: string, linkTo: string};
    refresher?: () => void;
    children?: React.ReactNode;
    secondaryRow?: React.ReactNode;
    triggerRefresherAtLoad?: boolean; // trigger refresher on load the component
}

function GenericTopbar({ customHeader, defaultHeader, refresher, children, secondaryRow, triggerRefresherAtLoad = true }: GenericTopbarProps) {
  const location = useLocation();

  useEffect(() => {
    triggerRefresherAtLoad && refresher && refresher();
  }, []);
  
  return (
    <div className={cn("grid items-center w-full", secondaryRow ? "grid-rows-[auto_auto]" : "grid-rows-[auto]")}>
      <div className="grid grid-cols-[auto_1fr_auto] w-full h-[69px] items-center gap-4 pl-4 border-b border-border">
        {customHeader ?? (
        defaultHeader ? (
        <div className="flex flex-row items-center gap-2">
          <Link
            to={defaultHeader.linkTo}
            className="text-muted-foreground text-lg no-underline"
          >{defaultHeader.title}</Link>
          
          {defaultHeader && location.pathname === defaultHeader.linkTo && refresher && (
          <Link to="#"
            onClick={() => refresher()}
          >
            <AnimatedRefreshCw size={16} />
          </Link>)
          }
        </div>
        ) : <div></div>
        )}

        <div className="">
          {children}
        </div>
        
        <div 
          className="flex flex-row items-center h-full min-w-max border-l border-border"
        >
          <UserInfo />
        </div>

      </div>
      {secondaryRow && (
      <div className="flex flex-row">
        {secondaryRow}
      </div>
      )}
    </div>
  );
}

export default GenericTopbar;
