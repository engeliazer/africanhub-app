import { BiSupport } from "react-icons/bi";
import PropTypes from "prop-types";

const SupportButton = ({
  onOpen=()=>{},
    }) => {
  return (
    <div className="flex md:space-x-4 top-right-links w-max  justify-items-end">
      {/*{switcher || <></>}*/}
      <button
        onClick={onOpen}
        className="flex items-center hover:bg-gray-200 md:pl-1.5 rounded">
        <div className="font-bold flex items-center space-x-2">
          <BiSupport className="h-5" />
          <div className="block">Support</div>
        </div>
      </button>
    </div>
  );
};

SupportButton.propTypes = {
  onOpen: PropTypes.func,
};

export default SupportButton;
