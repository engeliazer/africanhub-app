import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Dropdown, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";

const BrandName = ({
  brand="HRMS",
  companyName="Company Name",
  userName="John Doe",
  onLogout=() => {},
}) => {
  
    return (
      <div className="brand-name">
        <Link
          to="/"
          className="flex flex-col md:flex-row md:space-x-2 -space-y-1 md:space-y-0"
        >
          <span className="text-sm md:text-xl flex flex-row md:space-x-0">{brand}{companyName? ` |` : ""}</span>
          <span className=" text-sm md:text-2xl font-bold font-tahoma">
            {companyName? `${companyName}` : ""}
          </span>
        </Link>
      </div>
    );
};

BrandName.propTypes = {
    brand: PropTypes.string,
    userName: PropTypes.string,
    onLogout: PropTypes.func
};

export default BrandName;