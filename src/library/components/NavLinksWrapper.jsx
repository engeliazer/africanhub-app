import { Link } from "react-router-dom";
import { AppLinks } from "../../services/constants";

const NavLinksWrapper = () => {
  return (
    <ul className="hidden md:flex md:gap-6 items-center ">
      {
        AppLinks.map((link, index) => (
          <li key={index}>
            <Link to={link?.url}>{link?.name}</Link>
          </li>
        ))
      }
    </ul>
  );
};

export default NavLinksWrapper;
