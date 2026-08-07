import AppSidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function AppLayout() {
  const location = useLocation();

  if (location.pathname === "/ui") {
    return <Navigate to="/ui/services" replace />;
  }

  return (
      <SidebarProvider
        className="grid grid-cols-[auto_1fr] h-screen"
      >
        <AppSidebar />
        <main
          className="flex flex-1 mt-2.5 rounded-tl-lg bg-oscar-gray-1/50 border border-border overflow-y-auto"
        >
          <Outlet />
        </main>
      </SidebarProvider>
  );
}

export default AppLayout;
