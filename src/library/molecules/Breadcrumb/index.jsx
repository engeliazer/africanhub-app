import { Fragment } from "react";
import HomeList from "./HomeItem.jsx";
import { useLocation } from "react-router-dom";
import PagesList from "./PagesList.jsx";
import { getPage, getPagesList } from "../../../services/utils";
import PageItem from "./PageItem.jsx";

const Breadcrumb = () => {
  const location = useLocation();
  const pages = getPagesList(location);
  const page = getPage(location);

  return (
    <Fragment>
      <nav className="flex border-b border-gray-200 bg-white  mb-3 rounded w-full" aria-label="Breadcrumb">
        <ol role="list" className="mx-auto flex w-full max-w-screen-xl space-x-4 px-4 sm:px-6 lg:px-8">
           <HomeList />
            <PagesList items={pages} />
            <PageItem page={page} />
        </ol>
      </nav>
    </Fragment>
);
};

export default Breadcrumb;
