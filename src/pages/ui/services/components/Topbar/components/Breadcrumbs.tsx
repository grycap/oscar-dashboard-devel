import { Link, useLocation } from "react-router-dom";

function ServiceBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && x !== "ui");
  const [_, serviceId] = pathnames;

  return (
    <div className="flex flex-row items-center gap-2">
      {serviceId === "create" && (
        <>
          <span className="text-muted-foreground text-lg">
            {` > `}
          </span>
          <Link
            to="/ui/services/create"
            className="text-black text-lg no-underline"
          >{`Creating service`}</Link>
        </>
      )}
    </div>
  );
}

export default ServiceBreadcrumb;
