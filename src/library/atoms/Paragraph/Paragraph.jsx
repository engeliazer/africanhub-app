import  { Fragment } from "react";
import "./Paragraph.css";
import PropTypes from "prop-types";

const Paragraph = ({
  children,
  sentence,
  variant="default",
  size="medium",
                   }) => {
  return (
    <Fragment>
      <p
        className={`paragraph paragraph--${variant} paragraph--${size}`}
      >
        {sentence}
        {children}
      </p>
    </Fragment>
  );
};

Paragraph.propTypes = {
    children: PropTypes.node,
    sentence: PropTypes.string,
    variant: PropTypes.oneOf(["default", "subtle", "highlight"]),
    size: PropTypes.oneOf(["small", "medium", "large"]),
}

export default Paragraph;
