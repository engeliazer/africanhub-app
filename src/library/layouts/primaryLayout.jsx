import { TopNavbar } from "../components";
import { Fragment } from "react";
import { Outlet } from "react-router-dom";
import { Breadcrumb } from "../molecules/index.js";

const PrimaryLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Top Navigation */}
      <TopNavbar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb Bar */}
        <div className="bg-card border-b border-border px-4 md:px-6 pt-4 pb-3 mt-2">
          <Breadcrumb />
        </div>
        
        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1500px] 2xl:max-w-[1290px] px-4 sm:px-6 py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PrimaryLayout;
