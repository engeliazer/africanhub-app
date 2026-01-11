import { Spin } from "antd";
import PropTypes from "prop-types";

/**
 * Higher-Order Component (HOC) to add a loading spinner to a component.
 *
 * @template P - The props type of the wrapped component
 * @param {React.ComponentType<P>} Component - The component to wrap
 * @param {Partial<P>} [extraProps={}] - Additional props to pass to the wrapped component
 * @returns {React.ComponentType} - The enhanced component with loading spinner
 * @Example usage:
 * - const EnhancedComponent = withLoader(MyComponent);
 * - OR
 * - const EnhancedComponent = withLoader(MyComponent, { prop1: "value1" });
 */
const withLoader = (
  Component,
  extraProps = {}
)=> {
  /**
   * Enhanced component that displays a loading spinner when `isLoading` is true.
   *
   * @param {Object } props - The props for the wrapped component and loading state
   * @returns {JSX.Element} - The rendered component or loading spinner
   */
  return function HOC(props) {
    const newProps = {
      ...props,
      ...extraProps,
    };

    if (props?.isLoading) {
      return (
        <div className={"w-max mx-auto my-10"}>
          <Spin
            spinning={true}
            size={props?.size}
            tip={"Loading..."}
          />
        </div>
      );
    }

    return <Component {...newProps} />;
  };

};

withLoader.propTypes = {
    Component: PropTypes.elementType.isRequired,
    extraProps: PropTypes.object,

};

export default withLoader;

