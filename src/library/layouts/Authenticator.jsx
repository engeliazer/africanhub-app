
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthenticate } from "../../services/hooks";
import { AUTH_LOGIN, AUTH_USER } from "../../services/constants";
import { getTokenLocal, removeTokenLocal } from "../../services/utils/authorization";
import { Button, Spin } from "antd";
import { useSelector } from "react-redux";
import { INTRANET_URL } from "../../services/constants";

const AuthenticatorLayout = ({ children }) => {
    const location = useLocation();
    const localToken = getTokenLocal();
    const {authenticated} = useSelector((state) => state.access);
    const [shouldAuthenticate, setShouldAuthenticate] = useState(false);

    const { status } = useAuthenticate({
        url: AUTH_USER,
        enabled: shouldAuthenticate
    });

    useEffect(() => {
        if(!authenticated && localToken) {
            setShouldAuthenticate(true);
        }
    }, []);

    if(!authenticated && !localToken) {
        return children;
    }

    if (status === "pending" && !authenticated) {
        return (
            <div className="mt-40 mx-auto w-max">
                <Spin size="large" />
            </div>
        );
    }

    if (status === "error") {
        removeTokenLocal();
        return <Navigate to="/" replace />;
    }

    return children;
};

AuthenticatorLayout.propTypes = {
    children: PropTypes.node
};

export default AuthenticatorLayout;
