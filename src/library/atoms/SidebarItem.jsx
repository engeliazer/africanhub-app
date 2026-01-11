import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";

const SidebarItem = ({
                          icon,
                          name,
 url,
  collapsed,
     }) => {
  const isCurrent = window.location.pathname === url;

    return (
      <NavLink
        to={url}
                className={ `${isCurrent ?"bg-brandGreen text-white  hover:text-white hover:bg-brandGreen" : ""} flex hover:text-gray-950 px-2 py-1 rounded overflow-hidden items-center space-x-2 text-lg font-medium hover:bg-gray-300`}>
                <span className={""}>
                   {icon}
                </span>
                <span className={`${collapsed ? "hidden": ""}`}>
                    {name}
                </span>
      </NavLink>
    );
};

SidebarItem.propTypes = {
    icon: PropTypes.element,
    name: PropTypes.string,
    url: PropTypes.string,
    role: PropTypes.string,
    roles: PropTypes.array,
    collapsed: PropTypes.bool,
};

export default SidebarItem;