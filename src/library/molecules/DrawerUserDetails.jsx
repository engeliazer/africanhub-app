import PropTypes from "prop-types";

const DrawerUserDetails = ({
  fullname="John Doe",
  email="john.doe@ocrc.co.tz"
                           }) => {
  return (
    <div className="flex items-center justify-center flex-col border-b mb-3 pb-2">
      <div className="avatar hover:ring-2">{fullname?.charAt(0)}</div>
      <p className="text-center avatar-name capitalize">
        {fullname}
      </p>
      <p className="avatar-email">{email}</p>
    </div>
  );
};

DrawerUserDetails.propTypes = {
    fullname: PropTypes.string,
    email: PropTypes.string,
};

export default DrawerUserDetails;
