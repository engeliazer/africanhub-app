import { Spin } from "antd";
import PropTypes from "prop-types";

const Label = ({
  text="",
  isLoading=false,
               }) => {
  return (
    <div className={"flex items-center space-x-2"}>
       <span>
            {text}
       </span>
      {isLoading && <Spin size={"small"} />  }
    </div>
  );
};

Label.propTypes = {
    text: PropTypes.string,
    isLoading: PropTypes.bool,
};

export default Label;
