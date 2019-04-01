import React, { Component, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Text,
  TouchableWithoutFeedback,
  View,
  ViewPropTypes
} from "react-native";

import EStyleSheet from "react-native-extended-stylesheet";
import { FontAwesome } from "@expo/vector-icons";

export default class BackButton extends Component {
  render() {
    // chevron-left
    return (
      <TouchableWithoutFeedback onPress={this.props.onPress}>
        <View style={[styles.container, this.props.style]}>
          <FontAwesome
            name="angle-left"
            size={this.props.size}
            color={this.props.color}
          />
          <Text style={[styles.title, { color: this.props.color }]}>
            {this.props.title}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

BackButton.defaultProps = {
  size: 40,
  color: "white"
};

BackButton.propTypes = {
  onPress: PropTypes.func,
  size: PropTypes.number,
  color: PropTypes.string,
  style: ViewPropTypes.style,
  title: PropTypes.string
};

const styles = EStyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
    marginLeft: 10
  },
  title: {
    fontSize: "1rem",
    textAlign: "center",
    marginLeft: 4
  }
});
