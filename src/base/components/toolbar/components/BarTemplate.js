import React, { Component } from "react";
import PropTypes from "prop-types";
import { Animated, StyleSheet, ViewPropTypes } from "react-native";

const BAR_POSITIONS = {
  TOP: "top",
  BOTTOM: "bottom"
};

class BarTemplate extends Component {
  constructor(props) {
    super(props);

    this.state = {
      animation: new Animated.Value(1)
    };
  }

  componentWillReceiveProps(nextProps) {
    Animated.timing(this.state.animation, {
      toValue: nextProps.displayed ? 1 : 0,
      duration: 300
    }).start();
  }

  render() {
    const { style, position, children, height } = this.props;
    const isBottomBar = position === BAR_POSITIONS.BOTTOM;

    return (
      <Animated.View
        style={[
          styles.container,
          style,
          isBottomBar ? styles.bottomBar : styles.topBar,
          {
            height: height,
            opacity: this.state.animation,
            transform: [
              {
                translateY: this.state.animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [isBottomBar ? height : height * -1, 0]
                })
              }
            ]
          }
        ]}
      >
        {children}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    borderBottomWidth: 1,
    backgroundColor: "rgba(20, 20, 20, 0.5)"
  },
  topBar: {
    top: 0
  },
  bottomBar: {
    bottom: 0
  }
});

BarTemplate.defaultProps = {
  position: BAR_POSITIONS.TOP,
  displayed: true,
  height: 40
};

BarTemplate.propTypes = {
  style: ViewPropTypes.style,
  position: PropTypes.oneOf([BAR_POSITIONS.TOP, BAR_POSITIONS.BOTTOM]),
  displayed: PropTypes.bool,
  height: PropTypes.number,
  children: PropTypes.node
};

export { BarTemplate, BAR_POSITIONS };
