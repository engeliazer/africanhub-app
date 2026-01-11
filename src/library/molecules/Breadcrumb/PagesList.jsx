import{ Fragment } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { replaceWithSpace, ucWords} from "../../../services/utils";

const PagesList = ({
  items
    }) => {
  return (
     <Fragment>
       {
        items?.length > 0 && items.map((item, index) => (
           <li key={item} className="flex">
             <div className="flex items-center">
               <Fragment>
                 <svg
                   className="h-full w-6 flex-shrink-0 text-gray-200"
                   viewBox="0 0 24 44"
                   preserveAspectRatio="none"
                   fill="currentColor"
                   aria-hidden="true"
                 >
                   <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                 </svg>
               </Fragment>
               <Link
                 to={index <= 0 ? `/${item?.toLowerCase()}` : `/${items[index - 1]}/${item?.toLowerCase()}`}
                 className={`${items.length - 1 === index ? "text-primary" : "text-gray-600/80"} ml-4 text-sm font-semibold  hover:text-gray-700`}
               >
                 {
                    ucWords(replaceWithSpace(item ?? "", "-"))
                 }
               </Link>

             </div>
           </li>
         ))
       }
     </Fragment>
  );
};

PagesList.propTypes = {
    items: PropTypes.array,
};

export default PagesList;
