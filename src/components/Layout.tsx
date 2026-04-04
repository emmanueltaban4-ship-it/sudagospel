import { ReactNode } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
};

export default Layout;
