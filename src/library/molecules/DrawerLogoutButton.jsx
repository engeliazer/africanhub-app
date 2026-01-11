import { Button } from "antd";
import PropTypes from "prop-types";

const DrawerLogoutButton = ({
  isLoading=false,
  onSignOut=()=>{}
   }) => {
  return (
    <div className={"absolute bottom-5 left-0 right-0 w-[90%] mx-auto"}>
      <Button
        loading={isLoading}
        onClick={onSignOut}
        className="button button--state-primary w-full">
        Sign Out
      </Button>
    </div>
  );
};

DrawerLogoutButton.propTypes = {
  isLoading: PropTypes.bool,
  onSignOut: PropTypes.func,
};

export default DrawerLogoutButton;
