import { Fragment } from "react";
import PropTypes from "prop-types";

const YellowBar = ({children})=> {
  return (
    <Fragment>
      <div className="navbar-yellow flex justify-between shadow-md shadow-slate-900/5 relative">
        <div className="navbar-container flex items-start relative w-full">
          <div className="flex md:ml-[90px] justify-between items-end w-full md:w-[98%] relative ">
            <div className="business-name flex">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

YellowBar.propTypes = {
    children: PropTypes.node,
};

export default YellowBar;