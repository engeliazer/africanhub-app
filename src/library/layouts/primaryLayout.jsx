import { TopNavbar } from "../components";
import { Fragment } from "react";
import { Outlet } from "react-router-dom";
import { Breadcrumb } from "../molecules/index.js";

const PrimaryLayout = () => {
  
  return (
    <div className={"overflow-x-hidden relative max-h-screen"}>
      <TopNavbar />
      <div className='mx-auto w-screen md:w-screen md:max-w-[1500px] 2xl:max-w-[1290px] h-[2000px] sm:px-6 py-2 bg-mainWhite max-h-screen overflow-x-hidden'>
         <Fragment>
           <Breadcrumb />
           <Outlet />
         </Fragment>
      </div>
    </div>
);
};

export default PrimaryLayout;