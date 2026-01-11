import { Drawer } from "antd";
import { FiHome } from "react-icons/fi";
import { MenuLinkIcon } from "../atoms";
import PropTypes from "prop-types";

const MobileMenuWrapper = ({
  open=false,
  onClose=()=>{}
  }) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      closable={true}
      width={300}
      className={"md:hidden"}
      title={"Template"}
    >
      <div className={"flex flex-col md:hidden space-y-3"}>
         <MenuLinkIcon icon={<FiHome />} title={"Home"} url={"/"} />
         <MenuLinkIcon icon={<FiHome />} title={"About"} url={"/"} />
      </div>
    </Drawer>
  );
};

MobileMenuWrapper.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
};

export default MobileMenuWrapper;
