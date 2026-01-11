import { Link } from "react-router-dom";
import PropsTypes from "prop-types";

const MenuLinkIcon = ({
  icon,
  title,
  url
    }) => {
    return (
        <div className={"flex items-center space-x-2"}>
          {
            icon && <div>{icon}</div>
          }
          <div className="text-gray-900">
            <Link to={`${url}`}>{title}</Link>
          </div>
        </div>
    );
};

MenuLinkIcon.propTypes = {
    icon: PropsTypes.element,
    title: PropsTypes.string,
    url: PropsTypes.string
};

export default MenuLinkIcon;