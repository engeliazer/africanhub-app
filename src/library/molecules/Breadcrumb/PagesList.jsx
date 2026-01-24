import { Fragment } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { RightOutlined } from "@ant-design/icons";
import { replaceWithSpace, ucWords } from "../../../services/utils";
import { useTheme } from "../../../contexts/ThemeContext";

const PagesList = ({ items }) => {
  const { colors } = useTheme();
  return (
    <Fragment>
      {items?.length > 0 &&
        items.map((item, index) => {
          const isLast = items.length - 1 === index;
          return (
            <li key={item} className="flex items-center">
              <RightOutlined 
                className="text-xs mx-1.5 flex-shrink-0" 
                style={{ color: colors.textMuted }}
              />
              <Link
                to={
                  index <= 0
                    ? `/${item?.toLowerCase()}`
                    : `/${items[index - 1]}/${item?.toLowerCase()}`
                }
                className="text-xs md:text-sm font-medium transition-colors"
                style={{
                  color: isLast ? colors.primaryAccent : colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  if (!isLast) {
                    e.currentTarget.style.color = colors.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLast) {
                    e.currentTarget.style.color = colors.textSecondary;
                  }
                }}
              >
                {ucWords(replaceWithSpace(item ?? "", "-"))}
              </Link>
            </li>
          );
        })}
    </Fragment>
  );
};

PagesList.propTypes = {
  items: PropTypes.array,
};

export default PagesList;
