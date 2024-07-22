import Sidebar from "@/components/Sidebar";
import OscarColors, { ColorWithOpacity } from "@/styles";
import { Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
      }}
    >
      <Sidebar />
      <section
        style={{
          flex: 1,
          marginTop: 10,
          borderTopLeftRadius: 8,
          background: ColorWithOpacity(OscarColors.GrayE0, 0.5),
          border: `1px solid ${OscarColors.GrayD9}`,
        }}
      >
        <Outlet />
      </section>
    </main>
  );
}

export default AppLayout;
