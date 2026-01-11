import { Fragment } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const PageItem = ({
  page=""
                  }) => {
  return (
    <Fragment>
      {
        page && (
          <li key={page} className="flex">
            <div className="flex items-center">
              <>
                <svg
                  className="h-full w-6 flex-shrink-0 text-gray-200"
                  viewBox="0 0 24 44"
                  preserveAspectRatio="none"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                </svg>
              </>
              <Link
                to={`/${page?.toLowerCase()}`}
                className="ml-4 text-sm font-semibold text-primary hover:text-gray-700"

              >
                {
                  page === "cms" ? "Dashboard" : page?.charAt(0)?.toUpperCase() + page?.slice(1)?.toLowerCase()
                }
              </Link>
              <svg
                className="h-full w-6 flex-shrink-0 text-gray-200"
                viewBox="0 0 24 44"
                preserveAspectRatio="none"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
            </div>
          </li>
        )
      }
    </Fragment>
  );
};

PageItem.propTypes = {
    page: PropTypes.string,
};

export default PageItem;
