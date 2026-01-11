import {useAuthenticate} from "../../services/hooks";
import {Spin} from "antd";
import {useSelector} from "react-redux";
import PropTypes from "prop-types";
import {AUTH_USER} from "../../services/constants";

const WithAuthenticator = ({
    children
}) => {
    const authenticated = useSelector((state)=> state.access.authenticated);
    const {status} = useAuthenticate({url:AUTH_USER, enabled:!authenticated});

    if(status === "pending"){
        return <div className={"mx-auto w-max my-20"}>
            <Spin spinning={true} size={"large"} />
        </div>;
    }

    if(status === "error"){
        return <div className={"mx-auto w-max my-20"}>
            <h1>Failed to authenticate. Contact ICT Support</h1>
        </div>;
    }

    return children;
};

WithAuthenticator.propTypes = {
    children: PropTypes.node.isRequired
};

export default WithAuthenticator;
