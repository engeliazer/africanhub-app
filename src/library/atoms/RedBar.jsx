import  { Fragment } from "react";
import PropTypes from "prop-types";

const RedBar = ({children})=> {
  return (
    <Fragment>
      <div className="navbar-red">
        <div className="navbar-container w-full">
          <div className="flex justify-between  ml-[20px] w-[96%]">
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

RedBar.propTypes = {
    children: PropTypes.node,
};

export default RedBar;