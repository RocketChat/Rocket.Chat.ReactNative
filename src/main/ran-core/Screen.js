/**
 * ing
 * Integrate existing components
 */
import React, { cloneElement, Component } from "react";
import PropTypes from "prop-types";

const componentPropType = PropTypes.oneOfType([
  PropTypes.func,
  PropTypes.string
]);

export class Screen extends Component {
  render() {
    const { name, icon, children } = this.props;
    return cloneElement(children, {});
  }
}

Screen.propTypes = {
  name: PropTypes.string, //screen name
  icon: componentPropType, //tabbar icon
  children: PropTypes.node,
  options: PropTypes.object
};

Screen.defaultProps = {
  options: {}
};

export default Screen;
