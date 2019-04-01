import React from "react";
import PropTypes from "prop-types";
import {
  Animated,
  Dimensions,
  View,
  StyleSheet,
  ViewPropTypes
} from "react-native";

import FullScreenLayout from "./FullScreenLayout";
import BottomToolBar from "../../toolbar/components/BottomToolBar";
import { Header } from "react-navigation";

const PADDINGTOP = 0; //是否头上要留白

export default class MediaFullScreenBrowser extends React.Component {
  constructor(props, context) {
    super(props, context);

    this._toggleToolBar = this._toggleToolBar.bind(this);

    this.state = {
      isFullScreen: true,
      displayBottomBar: true
    };
  }

  _toggleToolBar(index, item) {
    this.setState({
      displayBottomBar: !this.state.displayBottomBar
    });
  }

  render() {
    const {
      mediaList,
      displaySelectionButtons,
      style,
      scrolledToItem,
      rightButtonPressed,
      middleBtSelected, //是否选择了原图
      middleButtonPressed,
      toggleHeader,
      displayHeader,
      leftButtonText,
      middleButtonText,
      rightButtonText
    } = this.props;
    const { isFullScreen, currentIndex, displayBottomBar } = this.state;
    const buttonEnabled = this.props.selectedNum > 0;

    let fullScreenLayout = (
      <FullScreenLayout
        ref="FullScreenLayout"
        dataSource={mediaList}
        initialIndex={currentIndex}
        displaySelectionButtons={displaySelectionButtons}
        updateTitle={this._updateTitle}
        toggleToolBar={this._toggleToolBar}
        toggleHeader={toggleHeader}
        scrolledToItem={scrolledToItem}
        isFullScreen={isFullScreen}
      />
    );

    return (
      <View
        style={[
          styles.container,
          {
            top: displayHeader ? -Header.HEIGHT : 0
          },
          style
        ]}
      >
        {fullScreenLayout}
        <BottomToolBar
          ref={ref => (this.bottomToolBarRef = ref)}
          height={PADDINGTOP}
          displayed={displayBottomBar}
          leftButtonText={leftButtonText}
          middleButtonText={middleButtonText}
          rightButtonText={
            buttonEnabled
              ? `${rightButtonText}(${this.props.selectedNum})`
              : rightButtonText
          }
          rightButtonPressed={() => {
            rightButtonPressed();
          }}
          middleButtonPressed={middleButtonPressed}
          middleBtSelected={middleBtSelected}
          leftButtonDisabled={!buttonEnabled}
          rightButtonDisabled={!buttonEnabled}
        />
      </View>
    );
  }
}

MediaFullScreenBrowser.defaultProps = {
  mediaList: [],
  initialIndex: 0,
  square: true,
  displaySelectionButtons: false
};

MediaFullScreenBrowser.propTypes = {
  style: ViewPropTypes.style,
  mediaList: PropTypes.array.isRequired,
  square: PropTypes.bool, //thumbnails height === width
  gridOffset: PropTypes.number, //offsets the width of the grid
  initialIndex: PropTypes.number, //set the current visible photo before displaying
  displayActionButton: PropTypes.bool, //Show action button to allow sharing, downloading, etc
  enableGrid: PropTypes.bool, //Whether to allow the viewing of all the photo thumbnails on a grid
  startOnGrid: PropTypes.bool, //Whether to start on the grid of thumbnails instead of the first photo
  displaySelectionButtons: PropTypes.bool, //Whether selection buttons are shown on each image
  onSelectionChanged: PropTypes.func, //Called when a media item is selected or unselected
  onActionButton: PropTypes.func, //Called when action button is pressed for a media,If you don't provide this props, ActionSheetIOS will be opened as default
  useCircleProgress: PropTypes.bool, //not yet
  onBack: PropTypes.func, //Called when done or back button is tapped.Back button will not be displayed if this is null.
  itemPerRow: PropTypes.number, //Sets images amount in grid row, default - 3 (defined in GridContainer)
  displayTopBar: PropTypes.bool, //Display top bar
  onPhotoLongPress: PropTypes.func, //Applied on Photo components' parent TouchableOpacity
  delayPhotoLongPress: PropTypes.number,
  selectedNum: PropTypes.number,
  rightButtonPressed: PropTypes.func,
  toggleHeader: PropTypes.func //是否显示reactNavigator的header
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flex: 1,
    height: Dimensions.get("window").height,
    backgroundColor: "white"
  }
});
