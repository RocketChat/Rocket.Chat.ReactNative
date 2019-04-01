/**
 * InputToolbar
 * the Component which show InputToolbar
 *
 * @zack
 */
import React, { Component } from "react";
import { StyleSheet, View, ViewPropTypes, Animated } from "react-native";
import PropTypes from "prop-types";

import Composer from "./Composer";
import RightButtons from "./RightButtons";
import LeftButtons from "./LeftButtons";

export default class InputToolbar extends Component {
  renderLeftButtons() {
    if (this.props.leftButtons) {
      return this.props.leftButtons;
    } else if (this.props.onDefaultActionButtonPressed) {
      return <LeftButtons {...this.props} />;
    }
    return null;
  }

  renderSend() {
    if (this.props.rightButtons) {
      return this.props.rightButtons;
    } else if (this.props.onDefaultSendPressed) {
      return <RightButtons {...this.props} />;
    }
    return null;
  }

  renderComposer() {
    if (this.props.renderComposer) {
      return this.props.renderComposer(this.props);
    }
    return <Composer ref="composerRef" {...this.props} />;
  }

  renderAccessory() {
    if (this.props.renderAccessory) {
      return (
        <View style={[styles.accessory, this.props.accessoryStyle]}>
          {this.props.renderAccessory(this.props)}
        </View>
      );
    }
    return null;
  }

  focus = () => {
    this.refs.composerRef.refs.composerInput.focus();
  };

  render() {
    return (
      <Animated.View style={[styles.container, this.props.containerStyle]}>
        <View style={[styles.primary, this.props.primaryStyle]}>
          {this.renderLeftButtons()}
          {this.renderComposer()}
          {this.renderSend()}
        </View>
        {this.renderAccessory()}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#b2b2b2",
    backgroundColor: "#FFFFFF"
  },
  primary: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start"
  },
  accessory: {
    height: 31
  }
});

InputToolbar.defaultProps = {
  renderAccessory: null,
  renderActions: null,
  renderSend: null,
  renderComposer: null,
  onDefaultActionButtonPressed: null,
  containerStyle: {},
  primaryStyle: {},
  accessoryStyle: {}
};

InputToolbar.propTypes = {
  renderAccessory: PropTypes.func,
  renderActions: PropTypes.func,
  renderSend: PropTypes.func,
  renderComposer: PropTypes.func,
  onDefaultActionButtonPress: PropTypes.func,
  containerStyle: ViewPropTypes.style,
  primaryStyle: ViewPropTypes.style,
  accessoryStyle: ViewPropTypes.style
};
