import { Fragment } from "react";
import { Logo } from "../atoms";
import { NotificationWrapper, RenderBasedOnAuthState } from "./index.js";
import AvatarWrapper from "./AvatarWrapper.jsx";
import NavLinksWrapper from "./NavLinksWrapper.jsx";
import SupportButton from "./SupportButton.jsx";
import ProfileDrawer from "./ProfileDrawer.jsx";
import BrandName from "../atoms/BrandName.jsx";
import { LuMenu } from "react-icons/lu";
import MobileMenuWrapper from "./MobileMenuWrapper.jsx";
import {RedBar, YellowBar} from "../atoms";
import PropTypes from "prop-types";

const TopNavbar = ({
  isLoggedIn=false,
                   }) => {
  return (
    <Fragment>
      <nav
        className="sticky top-0 left-0 right-0 z-50 flex-none flex-wrap items-center justify-between transition duration-500 dark:shadow-none dark:bg-transparent overflow-hidden">
        <RedBar>
          <Fragment>
            <div className={"relative z-50 flex items-center space-x-3"}>
              <Logo />
              <BrandName brand={"TEMPLATE"} />
            </div>
            <div className="flex justify-between items-center space-x-2">
              <NotificationWrapper />
              <RenderBasedOnAuthState authState={isLoggedIn} compNoAuth={<></>} compAuth={<AvatarWrapper />} />
            </div>
          </Fragment>
        </RedBar>
        <YellowBar>
          <Fragment>
            <div className={"block ml-[90px] md:hidden text-2xl text-gray-900"}>
              <LuMenu />
            </div>

            <NavLinksWrapper />
            <SupportButton />
          </Fragment>
        </YellowBar>
      </nav>
      <ProfileDrawer  />
      <MobileMenuWrapper open={false}/>
    </Fragment>
  );
};

TopNavbar.propTypes = {
    isLoggedIn: PropTypes.bool,
};

export default TopNavbar;
