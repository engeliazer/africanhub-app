import { forwardRef } from "react";
import "./Heading.css";
import PropsTypes from "prop-types";

const Heading = forwardRef((props, ref) => {
    const {
        type = "h1",
        text = "Heading",
        weight = "medium",
        className = "",
        ...otherProps
    } = props;

    return (
        <h1
            {...otherProps}
            ref={ref}
            className={`heading--${type} ${className} heading__${weight}`}
        >
            {text}
        </h1>
    );
});

Heading.displayName = 'Heading';

Heading.propTypes = {
    type: PropsTypes.oneOf(["h1", "h2", "h3", "h4", "h5", "h6"]),
    text: PropsTypes.string,
    className: PropsTypes.string,
    weight: PropsTypes.oneOf(["bold", "normal", "light", "medium", "semibold", "extrabold", "black", "italic"])
};

export default Heading;
