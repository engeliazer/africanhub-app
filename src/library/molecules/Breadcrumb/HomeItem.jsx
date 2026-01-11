import { HomeIcon } from "@heroicons/react/16/solid";
import {Link} from "react-router-dom";

const HomeList = () => {
  return (
    <li className="flex">
      <div className="flex items-center py-2">
        <Link to="/" className="text-gray-400 hover:text-gray-500">
          <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {/*<span className="sr-only">{location.pathname}</span>*/}
        </Link>
      </div>
    </li>
  );
};

export default HomeList;