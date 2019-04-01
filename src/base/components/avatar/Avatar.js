/**
 * React Native Avatar Component
 * the Component which show avatar
 *
 * @zack
 */

import React, { Component } from "react";
import {
  View,
  ViewPropTypes,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  findNodeHandle,
  UIManager
} from "react-native";
import PropTypes from "prop-types";
import EStyleSheet from "react-native-extended-stylesheet";

import Lightbox from "../lightbox/Lightbox";

export default class Avatar extends Component {
  renderDefaultAvatar() {
    return (
      <View
        style={[
          styles.avatarStyle,
          { backgroundColor: "#B0C4DE" },
          this.props.avatarStyle
        ]}
      />
    );
  }

  renderAvatar() {
    const { width, height } = Dimensions.get("window");
    return this.props.lightbox ? (
      <Lightbox
        activeProps={{
          style: [styles.avatarImageActiveStyle, { width, height }]
        }}
      >
        <Image
          style={[styles.avatarStyle, this.props.avatarStyle]}
          source={{ uri: this.props.avatar }}
        />
      </Lightbox>
    ) : (
      <Image
        style={[styles.avatarStyle, this.props.avatarStyle]}
        source={{ uri: this.props.avatar }}
      />
    );
  }

  renderAvatarName() {
    if (this.props.showName == true) {
      var showThisName = this.props.name
        ? this.props.name
        : this.props.defaultName
        ? this.props.defaultName
        : "";
      return (
        <Text
          style={[styles.textStyle, this.props.textStyle]}
          allowFontScaling={false}
          numberOfLines={this.props.numberOfNameLines}
        >
          {showThisName}
        </Text>
      );
    }
    return null;
  }

  _avatarPress = () => {
    if (this.props.onAvatarPress) {
      this.props.onAvatarPress(this.props);
    }
  };

  layout(ref) {
    const handle = findNodeHandle(ref);

    return new Promise(resolve => {
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        resolve({
          x,
          y,
          width,
          height,
          pageX,
          pageY
        });
      });
    });
  }

  render() {
    return (
      <TouchableOpacity
        style={[styles.containerStyle, this.props.avatarContainerStyle]}
        disabled={this.props.onAvatarPress ? false : true}
        onPress={this._avatarPress}
        accessibilityTraits="image"
      >
        {this.props.avatar ? this.renderAvatar() : this.renderDefaultAvatar()}
        {this.renderAvatarName()}
      </TouchableOpacity>
    );
  }
}

const styles = EStyleSheet.create({
  containerStyle: {
    flexDirection: "column",
    alignItems: "center"
  },
  avatarStyle: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    borderRadius: 5
  },
  avatarImageActiveStyle: {
    resizeMode: "contain"
  },
  textStyle: {
    color: "black",
    fontSize: 12,
    backgroundColor: "transparent",
    fontWeight: "normal"
  }
});

Avatar.defaultProps = {
  avatarStyle: { backgroundColor: "#faebd7" },
  showName: false,
  numberOfNameLines: 1,
  defaultName: "nothing"
};

Avatar.propTypes = {
  avatar: PropTypes.string,
  name: PropTypes.string,
  defaultName: PropTypes.string,
  avatarContainerStyle: ViewPropTypes.style,
  avatarStyle: ViewPropTypes.style,
  textStyle: Text.propTypes.style,
  onAvatarPress: PropTypes.func,
  showName: PropTypes.bool,
  numberOfNameLines: PropTypes.number,
  lightbox: PropTypes.bool
};
