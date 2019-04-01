import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  View,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Text,
  PanResponder
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Video } from "expo";

import { SelectionButtonStyles } from "../../../styles/SelectionButtonStyles";
import CONSTANTS from "../utils/constants";

const iconUnselectedColor = CONSTANTS.ICONUNSELECTEDCOLOR;
const iconSelectedColor = CONSTANTS.ICONSELECTEDCOLOR;
const THUMBNAILICONSIZE = 24;
const FULLSCREENICONSIZE = 24;

export default class Photo extends Component {
  constructor(props) {
    super(props);

    const { lazyLoad, uri } = props;

    this.state = {
      uri: lazyLoad ? null : uri,
      progress: 0,
      error: false,

      isAnimating: false,
      // for scalable
      scale: 1,
      lastScale: 1,
      offsetX: 0,
      offsetY: 0,
      lastX: 0,
      lastY: 0,

      showVideoIcon: props.showVideoIcon
    };

    this._onProgress = this._onProgress.bind(this);
    this._onError = this._onError.bind(this);
    this._onLoad = this._onLoad.bind(this);
    this._toggleSelection = this._toggleSelection.bind(this);
    this._togglePlayVideo = this._togglePlayVideo.bind(this);

    this.distant = 150;
    this.delay = 300;
    this.radius = 20;
    this.prevTouchInfo = {
      prevTouchX: 0,
      prevTouchY: 0,
      prevTouchTimeStamp: 0
    };
    this.doubleTapped = false;
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return !this.state.isAnimating;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (this.state.isAnimating) {
          return false;
        } else {
          return (
            (this.props.scalable && gestureState.dx > 2) ||
            gestureState.dy > 2 ||
            gestureState.numberActiveTouches === 2
          );
        }
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) =>
        !this.state.isAnimating,
      onPanResponderGrant: (evt, gestureState) => {
        const currentTouchTimeStamp = Date.now();
        // this.state.pan.setValue(0);
        // this.setState({
        //   isPanning: true,
        // });
        if (this.isDoubleTap(currentTouchTimeStamp, gestureState)) {
          this.doubleTapped = true;
          this.props.lockScrollView(true);
          this.doubleTapZoom();
        }
        this.prevTouchInfo = {
          prevTouchX: gestureState.x0,
          prevTouchY: gestureState.y0,
          prevTouchTimeStamp: currentTouchTimeStamp
        };
        if (gestureState.numberActiveTouches === 2) {
          this.distant = this.distance(
            evt.nativeEvent.touches[0].pageX,
            evt.nativeEvent.touches[0].pageY,
            evt.nativeEvent.touches[1].pageX,
            evt.nativeEvent.touches[1].pageY
          );
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        // zoom
        if (gestureState.numberActiveTouches === 2) {
          // let dx = Math.abs(evt.nativeEvent.touches[0].pageX - evt.nativeEvent.touches[1].pageX);
          // let dy = Math.abs(evt.nativeEvent.touches[0].pageY - evt.nativeEvent.touches[1].pageY);
          // let distant = Math.sqrt(dx * dx + dy * dy);
          this.props.lockScrollView(true);
          let distant = this.distance(
            evt.nativeEvent.touches[0].pageX,
            evt.nativeEvent.touches[0].pageY,
            evt.nativeEvent.touches[1].pageX,
            evt.nativeEvent.touches[1].pageY
          );
          let scale = (distant / this.distant) * this.state.lastScale;
          this.setState({ scale });
        }
        // translate
        else {
          if (gestureState.numberActiveTouches === 1 && this.state.scale > 1) {
            let offsetX = this.state.lastX + gestureState.dx / this.state.scale;
            let offsetY = this.state.lastY + gestureState.dy / this.state.scale;
            this.setState({ offsetX, offsetY });
          }
        }
      },

      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderRelease: (evt, gestureState) => {
        if (!this.doubleTapped && this.isSingleTap(Date.now(), gestureState)) {
          this.onTapOnce();
          setTimeout(
            function() {
              if (this.doubleTapped) {
                this.props.onDoubleTap();
              }
              this.doubleTapped = false;
            }.bind(this),
            this.delay
          );
        }
        if (this.state.scale > 1) {
          this.setState({
            lastX: this.state.offsetX,
            lastY: this.state.offsetY,
            lastScale: this.state.scale
          });
        } else {
          this.reset();
        }
      },
      onShouldBlockNativeResponder: evt => false
    });
  }

  // calculate distance between presses
  distance(x0, y0, x1, y1) {
    return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
  }

  // is double tap or not
  isDoubleTap(currentTouchTimeStamp, { x0, y0 }) {
    const { prevTouchX, prevTouchY, prevTouchTimeStamp } = this.prevTouchInfo;
    const dt = currentTouchTimeStamp - prevTouchTimeStamp;

    return (
      dt < this.delay &&
      this.distance(prevTouchX, prevTouchY, x0, y0) < this.radius
    );
  }

  // is single tap or not
  isSingleTap(currentTouchTimeStamp, { x0, y0 }) {
    const { prevTouchX, prevTouchY, prevTouchTimeStamp } = this.prevTouchInfo;
    const dt = currentTouchTimeStamp - prevTouchTimeStamp;

    return dt < 200 && this.distance(prevTouchX, prevTouchY, x0, y0) < 5;
  }

  onTapOnce = () => {
    this.props.onTapOnce ? this.props.onTapOnce() : null;
    if (this.props.isVideo) {
      this._togglePlayVideo();
    }
  };

  doubleTapZoom() {
    if (this.state.scale !== 1) {
      this.reset();
    } else {
      this.setState({
        scale: 1.8,
        lastScale: 1.8
      });
    }
  }

  // reset children
  reset() {
    this.props.lockScrollView(false);
    this.setState({
      scale: 1,
      lastScale: 1,
      offsetX: 0,
      offsetY: 0,
      lastX: 0,
      lastY: 0
    });
  }

  load() {
    if (!this.state.uri) {
      this.setState({
        uri: this.props.uri
      });
    }
  }

  // checkFileType = function(uri) {
  //   var type="pic";
  //   var suffix = uri ? uri.toLowerCase().split('.').splice(-1) : null;
  //   if (suffix && suffix[0].length > 4){
  //     suffix = suffix[0].slice(0, 2);
  //
  //     switch (suffix) {
  //       case 'mp4':
  //       case 'mov':
  //         type = 'mov';
  //         break;
  //     }
  //   }
  //   return type;
  // }

  _renderErrorIcon() {
    return <FontAwesome name="error-outline" size={22} color={"red"} />;
  }

  _renderProgressIndicator() {
    const { useCircleProgress } = this.props;
    const { progress } = this.state;

    if (progress < 1) {
      return <ActivityIndicator animating={true} />;
      // if (Platform.OS === 'android') {
      //   return <ActivityIndicator animating={ true }/>;
      // }
      //
      // const ProgressElement = useCircleProgress ? Progress.Circle : Progress.Bar;
      // return (
      //   <ProgressElement
      //     progress={progress}
      //     thickness={20}
      //     color={'white'}
      //   />
      // );
    }
    return null;
  }

  _onProgress(event) {
    const progress = event.nativeEvent.loaded / event.nativeEvent.total;
    if (!this.props.thumbnail && progress !== this.state.progress) {
      this.setState({
        progress
      });
    }
  }

  _onError() {
    this.setState({
      error: true,
      progress: 1
    });
  }

  _onLoad() {
    this.setState({
      progress: 1
    });
  }

  _toggleSelection() {
    // onSelection is resolved in index.js
    // and refreshes the dataSource with new media object
    this.props.onSelection(!this.props.selected);
  }

  _togglePlayVideo() {
    // console.log(this.videoRef.getStatusAsync());
    this.videoRef.getStatusAsync().then(ret => {
      if (ret.isPlaying) {
        this.videoRef.pauseAsync();
      } else {
        this.videoRef.playAsync();
      }
    });
    this.setState({
      showVideoIcon: !this.state.showVideoIcon
    });
    // this.videoRef.playAsync();
  }

  _renderSelectionButton() {
    const { progress } = this.state;
    const { displaySelectionButtons, selected, thumbnail } = this.props;

    // do not display selection before image is loaded
    if (!displaySelectionButtons || progress < 1) {
      return null;
    }

    let buttonImage;
    if (thumbnail) {
      let icon = (
        <FontAwesome
          name="check-circle-o"
          size={THUMBNAILICONSIZE}
          color={iconUnselectedColor}
          style={styles.thumbnailSelectionIcon}
        />
      );
      if (selected) {
        if (this.props.showSelectedNum) {
          icon = (
            <View style={styles.thumbnailSelectedNum}>
              <Text style={styles.selectedNumText}>
                {this.props.selectedNum}
              </Text>
            </View>
          );
        } else {
          icon = (
            <FontAwesome
              name="check-circle"
              size={THUMBNAILICONSIZE}
              color={iconSelectedColor}
              style={styles.thumbnailSelectionIcon}
            />
          );
        }
      }
      buttonImage = icon;
    } else {
      let icon = (
        <FontAwesome
          name="check-circle-o"
          size={FULLSCREENICONSIZE}
          color={iconUnselectedColor}
          style={styles.fullScreenSelectionIcon}
        />
      );
      if (selected) {
        if (this.props.showSelectedNum) {
          icon = (
            <View style={styles.fullScreenSelectedNum}>
              <Text style={styles.selectedNumText}>
                {this.props.selectedNum}
              </Text>
            </View>
          );
        } else {
          icon = (
            <FontAwesome
              name="check-circle"
              size={FULLSCREENICONSIZE}
              color={iconSelectedColor}
              style={styles.fullScreenSelectionIcon}
            />
          );
        }
      }
      buttonImage = icon;
    }

    return (
      <TouchableWithoutFeedback onPress={this._toggleSelection}>
        {buttonImage}
      </TouchableWithoutFeedback>
    );
  }

  _renderVideoIcon() {
    return (
      <View>
        <FontAwesome name="play-circle-o" size={40} color={iconSelectedColor} />
      </View>
    );
  }

  render() {
    console.log("photo render");
    const {
      resizeMode,
      width,
      height,
      thumbnail,
      scalable,
      isVideo
    } = this.props;
    const screen = Dimensions.get("window");
    const { uri, error, showVideoIcon } = this.state;

    const layoutStyle = {
      width: width || screen.width,
      height: height || screen.height
    };

    let source;
    if (uri) {
      // 可以兼容网络资源和本地资源
      source = typeof uri === "string" ? { uri } : uri;
    }

    let handlers;
    if (scalable) {
      handlers = this._panResponder.panHandlers;
    }

    return (
      <View
        style={[
          styles.container,
          layoutStyle,
          {
            transform: [
              { scaleX: this.state.scale },
              { scaleY: this.state.scale },
              { translateX: this.state.offsetX },
              { translateY: this.state.offsetY }
            ]
          }
        ]}
        {...handlers}
      >
        {error ? this._renderErrorIcon() : this._renderProgressIndicator()}
        {isVideo ? (
          <Video
            ref={ref => (this.videoRef = ref)}
            source={source}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={resizeMode}
            useNativeControls={false}
            shouldPlay={false}
            isLooping={true}
            style={[styles.image, layoutStyle]}
          />
        ) : (
          <Image
            {...this.props}
            style={[styles.image, layoutStyle]}
            source={source}
            onProgress={this._onProgress}
            onError={this._onError}
            onLoad={this._onLoad}
            resizeMode={resizeMode}
          />
        )}
        {this._renderSelectionButton()}
        {showVideoIcon ? this._renderVideoIcon() : null}
      </View>
    );
  }
}

Photo.defaultProps = {
  lazyLoad: false,
  resizeMode: "contain",
  useCircleProgress: true,
  thumbnail: false,
  displaySelectionButtons: false,
  selected: false,
  showVideoIcon: false,
  showSelectedNum: true
};

Photo.propTypes = {
  uri: PropTypes.oneOfType([
    // assets or http url
    PropTypes.string,
    // Opaque type returned by require('./image.jpg')
    PropTypes.number
  ]).isRequired,
  lazyLoad: PropTypes.bool,
  onSelection: PropTypes.func,
  resizeMode: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  useCircleProgress: PropTypes.bool,
  thumbnail: PropTypes.bool,
  displaySelectionButtons: PropTypes.bool, //右上角选择的小勾勾
  selected: PropTypes.bool,
  showVideoIcon: PropTypes.bool,
  showSelectedNum: PropTypes.bool, //以数字形式显示已选择
  selectedNum: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  scalable: PropTypes.bool // can be zoomed or not
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center"
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  ...SelectionButtonStyles
});
