import { HiUser } from "react-icons/hi";
import PropTypes from "prop-types";

const AvatarWrapper = ({
  name="John Doe",
  onOpen=()=>{}
                       }) => {
  return (
    <div
      className="user-profile"
      onClick={
        onOpen
      }
    >

      <div className="user-profile">
        <button

          className="font-bold capitalize flex justify-center items-center cursor-pointer"
        >
          <HiUser className="user-icon cursor-pointer" />
          <span className="hidden md:block">
              {name}
          </span>
        </button>
      </div>

    </div>
  );
};

AvatarWrapper.propTypes = {
    name: PropTypes.string,
    onOpen: PropTypes.func,
};

export default AvatarWrapper;
