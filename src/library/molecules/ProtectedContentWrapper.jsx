import  { Fragment } from "react";
import { canAccessRoute } from "../../services/utils";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

const ProtectedContentWrapper = ({
  children,
  }) => {
  const {canAccess:canAccessList} = useSelector((state) => state.access);
  const visitedRoute = window.location.pathname;
  const canAccess = canAccessRoute(visitedRoute, canAccessList);
  if(!canAccess) return null;

  return (
     <Fragment>
       {children}
     </Fragment>
  );
};

ProtectedContentWrapper.propTypes = {
  children: PropTypes.node,
};

export default ProtectedContentWrapper;
