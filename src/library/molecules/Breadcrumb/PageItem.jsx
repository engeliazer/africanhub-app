import { Fragment } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { RightOutlined } from "@ant-design/icons";
import { useTheme } from "../../../contexts/ThemeContext";

const PageItem = ({ page = "" }) => {
  const { colors } = useTheme();
  return (
    <Fragment>
      {page && (
        <li className="flex items-center">
          <RightOutlined 
            className="text-xs mx-1.5 flex-shrink-0" 
            style={{ color: colors.textMuted }}
          />
          <Link
            to={`/${page?.toLowerCase()}`}
            className="text-xs md:text-sm font-semibold transition-colors"
            style={{
              color: colors.primaryAccent,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.secondaryAccent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.primaryAccent;
            }}
          >
            {page === "cms"
              ? "Dashboard"
              : page?.charAt(0)?.toUpperCase() +
                page?.slice(1)?.toLowerCase()}
          </Link>
        </li>
      )}
    </Fragment>
  );
};

PageItem.propTypes = {
  page: PropTypes.string,
};

export default PageItem;
