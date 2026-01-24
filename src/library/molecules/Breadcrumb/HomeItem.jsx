import { HomeOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";

const HomeList = () => {
  const { colors } = useTheme();
  return (
    <li className="flex items-center">
      <Link 
        to="/" 
        className="flex items-center transition-colors"
        style={{
          color: colors.textSecondary,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = colors.primaryAccent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = colors.textSecondary;
        }}
      >
        <HomeOutlined className="text-sm" />
      </Link>
    </li>
  );
};

export default HomeList;
