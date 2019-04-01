import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Dimensions,
  FlatList,
  TouchableHighlight,
  View,
  StyleSheet,
  Text,
  ViewPropTypes
} from "react-native";

import Photo from "./Photo";
import CONSTANTS from "../utils/constants";

// 1 margin and 1 border width
const ITEM_MARGIN = 1;
const TOOLBAR_HEIGHT = CONSTANTS.TOOLBAR_HEIGHT;

export default class GridLayout extends Component {
  constructor(props, context) {
    super(props, context);

    this._renderItem = this._renderItem.bind(this);
    this._showVideoIcon = this._showVideoIcon.bind(this);

    this.state = {};
  }

  _itemSelectedStatus(item) {
    if (this.props.selectedDataSource.get(item.id)) {
      return true;
    }
    return false;
  }

  _showVideoIcon(item) {
    return item.isVideo ? item.isVideo : false;
    // return item.playableDuration > 0 ? true : false;
  }

  _ItemSelectedNum(item) {
    return (
      Array.from(this.props.selectedDataSource.keys()).indexOf(item.id) + 1
    );
  }

  _renderItem(item, index) {
    const {
      displaySelectionButtons,
      onPhotoTap,
      onSelectionTap,
      itemPerRow,
      square,
      offset
    } = this.props;
    const screenWidth = Dimensions.get("window").width - offset;
    const photoWidth = screenWidth / itemPerRow - ITEM_MARGIN * 2;

    return (
      <TouchableHighlight
        onPress={() => {
          onPhotoTap(index, item);
        }}
      >
        <View style={styles.row}>
          <Photo
            width={photoWidth}
            height={square ? photoWidth : 100}
            resizeMode={"cover"}
            thumbnail={true}
            displaySelectionButtons={displaySelectionButtons}
            uri={item.thumb || item.photo || item.video}
            showVideoIcon={this._showVideoIcon(item)}
            selected={this._itemSelectedStatus(item)}
            onSelection={() => {
              onSelectionTap(index, item);
            }}
            showSelectedNum={true}
            selectedNum={this._ItemSelectedNum(item)}
          />
        </View>
      </TouchableHighlight>
    );
  }

  // 如果是正方形的话!!!
  _getItemLayout = (data, index) => {
    let length = Dimensions.get("window").width / this.props.itemPerRow;
    return { length, offset: length * index, index };
  };

  render() {
    const { dataSource, itemPerRow } = this.props;

    return (
      <View style={styles.container}>
        <FlatList
          data={dataSource}
          initialNumToRender={24}
          renderItem={({ item, index }) => this._renderItem(item, index)}
          numColumns={itemPerRow}
          keyExtractor={item => item.id}
          onEndReached={() => {
            this.props.onEndReached();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<Text>Loading...</Text>}
          getItemLayout={this._getItemLayout}
        />
      </View>
    );
  }
}

GridLayout.defaultProps = {
  displaySelectionButtons: false,
  onPhotoTap: () => {},
  itemPerRow: 4,
  offset: ITEM_MARGIN
};

GridLayout.propTypes = {
  style: ViewPropTypes.style,
  square: PropTypes.bool, //photo is square nor not
  dataSource: PropTypes.array.isRequired,
  displaySelectionButtons: PropTypes.bool,
  onPhotoTap: PropTypes.func,
  itemPerRow: PropTypes.number,
  onSelectionTap: PropTypes.func, //右上角 勾勾点击
  offset: PropTypes.number //offsets the width of the grid
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: TOOLBAR_HEIGHT
  },
  row: {
    justifyContent: "center",
    margin: ITEM_MARGIN,
    alignItems: "center"
    // borderWidth: 1,
    // borderRadius: 1,
  }
});
