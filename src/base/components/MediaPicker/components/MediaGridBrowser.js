import React from "react";
import PropTypes from "prop-types";
import { Dimensions, View, StyleSheet, ViewPropTypes } from "react-native";

import GridLayout from "./GridLayout";
import BottomToolBar from "../../toolbar/components/BottomToolBar";

const PADDINGTOP = 0; //是否头上要留白

export default class MediaGridBrowser extends React.Component {
  constructor(props, context) {
    super(props, context);

    this._onSelectionTap = this._onSelectionTap.bind(this);

    this.state = {
      selectedDataSource: new Map()
    };
  }

  updateSelectedDataSource(newSelectedDataSource) {
    this.setState({
      selectedDataSource: newSelectedDataSource
    });
  }

  // 有就删 没有就加
  _onSelectionTap(index, item) {
    var selectedDataSourceTemp = this.state.selectedDataSource;
    if (selectedDataSourceTemp.get(item.id)) {
      selectedDataSourceTemp.delete(item.id);
    } else {
      selectedDataSourceTemp.set(item.id, item);
    }
    this.setState({
      selectedDataSource: selectedDataSourceTemp
    });
  }

  render() {
    const {
      displaySelectionButtons,
      itemPerRow,
      style,
      square,
      gridOffset,
      mediaList,
      displayBottomBar,
      leftButtonPressed,
      rightButtonPressed,
      onEndReached,
      checkFileTypeVideo,
      leftButtonText,
      middleButtonText,
      rightButtonText
    } = this.props;
    const { selectedDataSource } = this.state;
    const buttonEnabled = selectedDataSource.size > 0;

    let gridLayout = (
      <GridLayout
        square={square}
        offset={gridOffset}
        dataSource={mediaList}
        selectedDataSource={selectedDataSource}
        displaySelectionButtons={displaySelectionButtons}
        onPhotoTap={this._onSelectionTap}
        onSelectionTap={this._onSelectionTap}
        itemPerRow={itemPerRow}
        onEndReached={onEndReached}
        checkFileTypeVideo={checkFileTypeVideo}
      />
    );

    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: gridLayout ? PADDINGTOP : 0
          },
          style
        ]}
      >
        {gridLayout}
        <BottomToolBar
          ref={ref => (this.bottomToolBarRef = ref)}
          height={PADDINGTOP}
          displayed={displayBottomBar}
          leftButtonText={leftButtonText}
          middleButtonText={middleButtonText}
          rightButtonText={
            buttonEnabled
              ? `${rightButtonText}(${selectedDataSource.size})`
              : rightButtonText
          }
          leftButtonPressed={() => {
            leftButtonPressed(selectedDataSource);
          }}
          rightButtonPressed={() => {
            rightButtonPressed(selectedDataSource);
          }}
          leftButtonDisabled={!buttonEnabled}
          rightButtonDisabled={!buttonEnabled}
        />
      </View>
    );
  }
}

MediaGridBrowser.defaultProps = {
  mediaList: [],
  square: true,
  displaySelectionButtons: false,
  displayBottomBar: true
};

MediaGridBrowser.propTypes = {
  style: ViewPropTypes.style,
  mediaList: PropTypes.array,
  square: PropTypes.bool, //thumbnails height === width
  gridOffset: PropTypes.number, //offsets the width of the grid
  displaySelectionButtons: PropTypes.bool, //Whether selection buttons are shown on each image
  onActionButton: PropTypes.func, //Called when action button is pressed for a media,If you don't provide this props, ActionSheetIOS will be opened as default
  onBack: PropTypes.func, //Called when done or back button is tapped.Back button will not be displayed if this is null.
  itemPerRow: PropTypes.number, //Sets images amount in grid row, default - 3 (defined in GridLayout)
  displayBottomBar: PropTypes.bool, //Display top bar
  leftButtonPressed: PropTypes.func,
  rightButtonPressed: PropTypes.func
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  }
});
