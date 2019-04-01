/**
 * InputToolbar
 * the Component which show RightButtons area
 *
 * @zack
 */

import React, { Component } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";

class RightButtons extends Component {
  render() {
    return (
      <TouchableOpacity
        style={styles.containerStyle}
        onPress={() => {
          this.props.onDefaultSendPressed();
        }}
        accessibilityTraits="button"
      >
        <Text style={[styles.textStyle, this.props.textStyle]}>
          {this.props.sendButtonLabel}
        </Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  containerStyle: {
    width: 61,
    height: 44,
    justifyContent: "flex-end"
  },
  textStyle: {
    color: "#0084ff",
    fontWeight: "600",
    fontSize: 17,
    backgroundColor: "transparent",
    marginBottom: 12,
    marginLeft: 10,
    marginRight: 10
  }
});

RightButtons.defaultProps = {
  text: "",
  onDefaultSendPressed: () => {},
  sendButtonLabel: "",
  textStyle: {}
};

RightButtons.propTypes = {
  text: PropTypes.string,
  onDefaultSendPressed: PropTypes.func,
  sendButtonLabel: PropTypes.string,
  textStyle: Text.propTypes.style
};

module.exports = RightButtons;
