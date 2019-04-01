/**
 * react-native-IntroductionItem Component
 * the Component which show simple introduction information
 * @zack
 */

import React, { Component } from "react";
import {
  View,
  StyleSheet,
  ViewPropTypes,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions
} from "react-native";
import PropTypes from "prop-types";
import EStyleSheet from "react-native-extended-stylesheet";

import { FontAwesome } from "@expo/vector-icons";

import Avatar from "../avatar/Avatar";
import Lightbox from "../lightbox/Lightbox";

export default class IntroductionItem extends Component {
  _onAvatarPress = () => {
    if (this.props.onAvatarPress) {
      this.props.onAvatarPress(this.props);
    }
  };

  renderAvatar() {
    if (this.props.renderAvatar) {
      return this.props.renderAvatar(this.getInnerComponentProps());
    }
    if (this.props.avatar) {
      const avatarProps = this.getInnerComponentProps();
      return <Avatar {...avatarProps} onPress={this._onAvatarPress} />;
    }
    return null;
  }

  _onDetailImagesPress = () => {
    if (this.props.onDetailImagesPress) {
      this.props.onDetailImagesPress(this.props);
    }
  };

  renderIntroInfo() {
    if (this.props.renderIntroInfo) {
      return this.props.renderIntroInfo(this.getInnerComponentProps());
    }
    if (this.props.mainTitle || this.props.info || this.props.detailImages) {
      return (
        <View style={[styles.introInfoStyle, this.props.introInfoStyle]}>
          {this.props.mainTitle ? (
            <Text
              style={[styles.mainTitleStyle, this.props.mainTitleStyle]}
              numberOfLines={this.props.numberOfMainTitleLines}
            >
              {this.props.mainTitle}
            </Text>
          ) : null}
          {this.props.info ? (
            <Text
              style={[styles.infoStyle, this.props.infoStyle]}
              numberOfLines={this.props.numberOfInfoLines}
            >
              {this.props.info}
            </Text>
          ) : null}
          {!this.props.showLargeImage && this.props.detailImages ? (
            <TouchableOpacity
              disabled={this.props.onDetailImagesPress ? false : true}
              onPress={this._onDetailImagesPress}
            >
              <View
                style={[styles.imageslistStyle, this.props.imageslistStyle]}
              >
                {this.props.detailImages.map((image, i) => {
                  if (i < this.props.detailImagesNum - 1) {
                    return (
                      <Image
                        key={image + i}
                        style={[
                          styles.introImageStyle,
                          this.props.introImageStyle
                        ]}
                        source={{ uri: image }}
                      />
                    );
                  }
                  if (i === this.props.detailImagesNum - 1) {
                    if (
                      this.props.detailImages.length >
                      this.props.detailImagesNum
                    ) {
                      return this.props.ellipsesImageUrl ? (
                        <Image
                          key={image + i}
                          style={[
                            styles.introImageStyle,
                            this.props.introImageStyle
                          ]}
                          source={{ uri: this.props.ellipsesImageUrl }}
                        />
                      ) : (
                        <FontAwesome
                          key={i}
                          name="ellipsis-h"
                          size={22}
                          color="#666"
                        />
                      );
                    } else {
                      return (
                        <Image
                          key={image + i}
                          style={[
                            styles.introImageStyle,
                            this.props.introImageStyle
                          ]}
                          source={{ uri: image }}
                        />
                      );
                    }
                  }
                })}
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    return null;
  }

  renderImageListItem = (item, index) => {
    const { width, height } = Dimensions.get("window");
    return (
      <Lightbox
        activeProps={{
          style: [
            styles.avatarImageActiveStyle,
            {
              width,
              height
            }
          ]
        }}
        galleryMode={this.props.galleryMode}
        GKey={this.props.GKey}
      >
        <Image
          key={item}
          style={[styles.introImageStyle, this.props.introImageStyle]}
          source={{
            uri: item
          }}
        />
      </Lightbox>

      // <TouchableWithoutFeedback
      //   disabled={this.props.onDetailImagesPress ? false : true}
      //   onPress={this._onDetailImagesPress}>
      //   <Image
      //     key={item}
      //     style={[styles.introImageStyle,  this.props.introImageStyle]}
      //     source={{uri: item}} />
      // </TouchableWithoutFeedback>
    );
  };

  renderLargeImageList() {
    if (this.props.renderLargeImageList) {
      return this.props.renderLargeImageList(this.getInnerComponentProps());
    }
    if (this.props.detailImages) {
      let imageHeight = this.props.introImageStyle.height
        ? this.props.introImageStyle.height
        : styles.introImageStyle.height;
      return (
        <View
          style={[
            styles.imageslistStyle,
            {
              height: imageHeight
            }
          ]}
        >
          <FlatList
            ref={ref => (this.imageListRef = ref)}
            data={this.props.detailImages}
            renderItem={({ item, index }) =>
              this.renderImageListItem(item, index)
            }
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item + index}
          />
        </View>
      );
    }
  }

  renderDivide() {
    if (this.props.renderBottomInfo || this.props.bottomInfo) {
      return <View style={[styles.divideStyle, this.props.divideStyle]} />;
    }
    return null;
  }

  renderBottomInfo() {
    if (this.props.renderBottomInfo) {
      return this.props.renderBottomInfo(this.getInnerComponentProps());
    }
    if (this.props.bottomInfo) {
      return (
        <Text style={[styles.bottomInfoStyle, this.props.bottomInfoStyle]}>
          {this.props.bottomInfo}
        </Text>
      );
    }
    return null;
  }

  _onPress = () => {
    if (this.props.onItemPress) {
      this.props.onItemPress(this.props);
    }
  };

  render() {
    return (
      <TouchableOpacity
        disabled={this.props.onItemPress ? false : true}
        onPress={this._onPress}
      >
        <View style={styles.mainviewContainerStyle}>
          <View style={[styles.containerStyle, this.props.containerStyle]}>
            {this.renderAvatar()}
            {this.renderIntroInfo()}
          </View>
          {this.props.showLargeImage ? this.renderLargeImageList() : null}
          {this.renderDivide()}
          {this.renderBottomInfo()}
        </View>
      </TouchableOpacity>
    );
  }

  getInnerComponentProps() {
    const {
      renderAvatar,
      renderIntroInfo,
      renderBottomInfo,
      renderLargeImageList,
      containerStyle,
      introInfoStyle,
      bottomInfoStyle,
      mainTitleStyle,
      introImageStyle,
      infoStyle,
      imageslistStyle,
      divideStyle,
      detailImages,
      detailImagesNum,
      ellipsesImageUrl,
      onItemPress,
      onDetailImagesPress,
      ...props
    } = this.props;
    return {
      ...props
    };
  }
}

const styles = EStyleSheet.create({
  mainviewContainerStyle: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginLeft: 0,
    marginRight: 0
  },
  containerStyle: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginLeft: 0,
    marginRight: 0
  },
  introInfoStyle: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginLeft: 8,
    marginRight: 0
  },
  mainTitleStyle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "left",
    backgroundColor: "transparent",
    color: "black"
  },
  infoStyle: {
    fontSize: 12,
    fontWeight: "normal",
    textAlign: "left",
    backgroundColor: "transparent",
    color: "black",
    maxWidth: 300
  },
  imageslistStyle: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 0,
    marginRight: 0
  },
  introImageStyle: {
    justifyContent: "center",
    alignItems: "center",
    width: 25,
    height: 25,
    borderRadius: 5,
    marginLeft: 0,
    marginRight: 6,
    resizeMode: "contain"
  },
  avatarImageActiveStyle: {
    resizeMode: "contain"
  },
  divideStyle: {
    marginTop: 5,
    marginLeft: 2,
    marginRight: 2,
    minWidth: 100,
    height: 2 * StyleSheet.hairlineWidth,
    backgroundColor: "#EFEFF4"
  },
  bottomInfoStyle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "left",
    backgroundColor: "transparent",
    color: "#b2b2b2",
    marginLeft: 8
  }
});

IntroductionItem.defaultProps = {
  numberOfMainTitleLines: 1,
  numberOfInfoLines: 4,
  detailImagesNum: 4,
  showLargeImage: true
};

IntroductionItem.propTypes = {
  renderAvatar: PropTypes.func,
  renderIntroInfo: PropTypes.func,
  showLargeImage: PropTypes.bool, //show large images or not
  renderLargeImageList: PropTypes.func,
  galleryMode: PropTypes.bool,
  GKey: PropTypes.string,
  renderBottomInfo: PropTypes.func,
  bottomInfo: PropTypes.string,
  containerStyle: ViewPropTypes.style,
  introInfoStyle: ViewPropTypes.style,
  bottomInfoStyle: Text.propTypes.style,
  mainTitleStyle: Text.propTypes.style,
  numberOfMainTitleLines: PropTypes.number,
  introImageStyle: ViewPropTypes.style,
  infoStyle: Text.propTypes.style,
  numberOfInfoLines: PropTypes.number,
  imageslistStyle: ViewPropTypes.style,
  divideStyle: ViewPropTypes.style,
  avatar: PropTypes.string, //used for chatListItem avatar in renderListItem func.
  name: PropTypes.string,
  mainTitle: PropTypes.string, //used for chatListItem avatar in renderListItem func.
  info: PropTypes.string, //used for chatListItem avatar in renderListItem func.
  detailImages: PropTypes.array,
  detailImagesNum: PropTypes.number,
  ellipsesImageUrl: PropTypes.string,
  onItemPress: PropTypes.func,
  onDetailImagesPress: PropTypes.func,
  onAvatarPress: PropTypes.func
};
