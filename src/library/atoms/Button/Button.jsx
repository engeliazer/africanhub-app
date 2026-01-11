import { forwardRef } from "react";
import "./Button.css";
import PropsTypes from "prop-types";

/**
 * A reusable button component that supports different variants, sizes, and loading states.
 * It extends the native button element, allowing for additional props like `onClick`, `disabled`, etc.
 * @param variant - The visual style of the button.
 * @param size
 * @param isLoading
 * @param disabled
 * @param className
 * @param props
 * @returns {JSX.Element} A styled button component.
 */
const Button = forwardRef((props, ref) => {
    const {
        variant = "primary",
        size = "medium",
        isLoading = false,
        disabled,
        className,
        look = "solid",
        ...otherProps
    } = props;

    const isDisabled = disabled || isLoading; // Handle disabled state

    return (
        <button
            {...otherProps}
            ref={ref}
            disabled={isDisabled}
            className={`
        button
        button--${size} 
        button__${look}--${variant}
        ${isDisabled ? "button--disabled" : ""} 
         ${isLoading ? "button--loading" : ""}
        ${className ?? ""}
      `}
        >
            {isLoading && <span className="dots-loader"></span>}
            {otherProps?.children}
        </button>
    );
});

Button.displayName = 'Button';

Button.propTypes = {
    variant: PropsTypes.oneOf(["primary", "secondary", "tertiary", "danger", "warning", "success"]),
    size: PropsTypes.oneOf(["small", "medium", "large"]),
    isLoading: PropsTypes.bool,
    disabled: PropsTypes.bool,
    className: PropsTypes.string,
    look: PropsTypes.oneOf(["solid", "outline"]),
    children: PropsTypes.node
};

export default Button;
