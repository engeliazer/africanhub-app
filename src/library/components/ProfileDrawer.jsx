import { Drawer } from "antd";
import { DrawerLogoutButton, DrawerUserDetails } from "../molecules/index.js";
import PropTypes from "prop-types";

const ProfileDrawer = ({
  onClose=()=>{},
  open=false,
  children
     }) => {
  return (
    <Drawer
      title={<span className={"text-primary font-semibold"}> Account & Activities</span>}
      onClose={onClose}
      open={open}
    >
       <DrawerUserDetails  />
      {
        children
      }
      <DrawerLogoutButton />
    </Drawer>
  );
};

ProfileDrawer.propTypes = {
    onClose: PropTypes.func,
    open: PropTypes.bool,
    children: PropTypes.node,
};

export default ProfileDrawer;
