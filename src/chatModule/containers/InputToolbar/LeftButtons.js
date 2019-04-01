/**
 * InputToolbar
 * the Component which show LeftButtons area
 *
 * @zack
 */

import React, { Component } from "react";
import {
  StyleSheet,
  View,
  ViewPropTypes,
  Text,
  TouchableOpacity,
  ActionSheetIOS
} from "react-native";
import PropTypes from "prop-types";

import Icon from "@expo/vector-icons/FontAwesome";

class LeftButtons extends Component {
  constructor(props) {
    super(props);
    this.onActionsPress = this.onActionsPress.bind(this);
  }

  onActionsPress() {
    const options = Object.keys(this.props.options);
    const cancelButtonIndex = Object.keys(this.props.options).length - 1;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        tintColor: this.props.optionTintColor
      },
      buttonIndex => {
        let i = 0;
        for (let key in this.props.options) {
          if (this.props.options.hasOwnProperty(key)) {
            if (buttonIndex === i) {
              this.props.options[key](this.props);
              return;
            }
            i++;
          }
        }
      }
    );
  }

  render() {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={this.props.onDefaultActionButtonPressed || this.onActionsPress}
      >
        {this.renderButtons()}
      </TouchableOpacity>
    );
  }

  // <Icon name="plus-circle" size={22} color={'red'}/>
  renderButtons() {
    if (this.props.icon) {
      return this.props.icon();
    }
    return (
      <View style={[styles.wrapper, this.props.wrapperStyle]}>
        <Text style={[styles.iconText, this.props.iconTextStyle]}>+</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10
  },
  wrapper: {
    borderRadius: 13,
    borderColor: "#b2b2b2",
    borderWidth: 2,
    flex: 1
  },
  iconText: {
    color: "#b2b2b2",
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "transparent",
    textAlign: "center"
  }
});

LeftButtons.contextTypes = {
  actionSheet: PropTypes.func
};

LeftButtons.defaultProps = {
  onSend: () => {},
  options: {},
  optionTintColor: "#007AFF",
  iconTextStyle: {},
  onDefaultActionButtonPressed: null
};

LeftButtons.propTypes = {
  onSend: PropTypes.func,
  options: PropTypes.object,
  optionTintColor: PropTypes.string,
  icon: PropTypes.func,
  onDefaultActionButtonPressed: PropTypes.func,
  iconTextStyle: Text.propTypes.style
};

module.exports = LeftButtons;
