import { forwardRef } from "react";
import "./StatusTag.css";
import PropTypes from "prop-types";

/**
 * A reusable status tag component that supports different statuses.
 * @param status - The status of the tag.
 * @param children - The content of the tag.
 * @returns {JSX.Element} A styled status tag component.
 */
const StatusTag = forwardRef((props, ref) => {
    const {
        status = "pending",
        children,
        className,
        size = "small",
        ...otherProps
    } = props;

    return (
        <div
            {...otherProps}
            ref={ref}
            className={`tag-status tag-status--${status} tag-status--${size} ${className ?? ""}`}
        >
            {children}
        </div>
    );
});

StatusTag.displayName = 'StatusTag';

StatusTag.propTypes = {
    status: PropTypes.oneOf(["pending", "approved", "rejected", "completed", "returned"]),
    size: PropTypes.oneOf(["small", "medium", "large"]),
    children: PropTypes.node,
    className: PropTypes.string
};

export default StatusTag;
