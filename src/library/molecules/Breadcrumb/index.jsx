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
    <nav className="flex w-full" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-1.5 text-xs md:text-sm">
        <HomeList />
        <PagesList items={pages} />
        <PageItem page={page} />
      </ol>
    </nav>
  );
};

export default Breadcrumb;
