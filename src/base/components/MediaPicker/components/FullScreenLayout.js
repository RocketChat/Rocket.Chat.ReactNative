import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Dimensions,
  FlatList,
  View,
  ViewPagerAndroid,
  StyleSheet,
  ViewPropTypes,
  Platform,
  StatusBar
} from "react-native";

import Photo from "./Photo";
import CONSTANTS from "../utils/constants";

const TOOLBAR_HEIGHT = CONSTANTS.TOOLBAR_HEIGHT;
const DRAG_SWIPE_THRESHOLD = 0;
const DRAG_SWIPE_TRIGGER_THRESHOLD = Dimensions.get("window").width / 3;

export default class FullScreenLayout extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      currentIndex: props.initialIndex,
      currentMedia: props.dataSource[props.initialIndex],
      scrollEnabled: true
    };

    this.mediaRefs = [];
    this.scrollOffsetX = 0; //onscroll先执行，再执行_onMomentumScrollBegin，所以通过记录_onMomentumScrollBegin之前的scrollOffsetX，来判断scroll的方向。
    this.isDragScrolling = false; //触发切换图片后正在滚动
    this.isScrolling = false; //用于隐藏/显示工具栏
    this.onDoubleTap = false;

    this._renderItem = this._renderItem.bind(this);
    this._onMomentumScrollBegin = this._onMomentumScrollBegin.bind(this);
    this._onMomentumScrollEnd = this._onMomentumScrollEnd.bind(this);
    this._onScrollBeginDrag = this._onScrollBeginDrag.bind(this);
    this._onScrollEndDrag = this._onScrollEndDrag.bind(this);
    this._onNextButtonTapped = this._onNextButtonTapped.bind(this);
    this._onPreviousButtonTapped = this._onPreviousButtonTapped.bind(this);
    this.getItemLayout = this.getItemLayout.bind(this);
  }

  getItemLayout(data, index) {
    const screenWidth = Dimensions.get("window").width;
    return { length: screenWidth, offset: screenWidth * index, index };
  }

  //用于定位到相应图片
  openPage(index, animated = false) {
    if (!this.flatListRef) {
      return;
    }
    this._updatePageIndex(index);
    this.flatListRef.scrollToIndex({ animated: animated, index: index });

    //调用父级，告诉他现在到了那个item
    if (this.props.scrolledToItem) {
      this.props.scrolledToItem(this.props.dataSource[index]);
    }
  }

  scrollToIndex(options) {
    this.flatListRef.scrollToOffset(options);
  }

  lockScrollView = lock => {
    if (lock) {
      this.setState({
        scrollEnabled: false
      });
    } else {
      this.setState({
        scrollEnabled: true
      });
    }
  };

  _onTapOnce = () => {
    if (this.props.toggleToolBar && !this.isScrolling) {
      this.onDoubleTap = false;
      setTimeout(
        function() {
          if (!this.onDoubleTap) {
            this.props.toggleToolBar();
            this.props.toggleHeader();
          }
        }.bind(this),
        300
      );
    }
  };

  _onDoubleTap = () => {
    this.onDoubleTap = true;
  };

  // 可以更新正在浏览的图片的信息，包括title
  _updatePageIndex(index) {
    this.setState(
      {
        currentIndex: index,
        currentMedia: this.props.dataSource[index]
      },
      () => {
        this._triggerPhotoLoad(index);

        const newTitle = `${index + 1} / ${this.props.dataSource.length}`;
        if (this.props.updateTitle) {
          this.props.updateTitle(newTitle);
        }
      }
    );
  }

  _triggerPhotoLoad(index) {
    const photo = this.mediaRefs[index];
    if (photo) {
      photo.load();
    } else {
      // HACK: photo might be undefined when user taps a photo from gridview
      // that hasn't been rendered yet.
      // photo is rendered after listView's scrollTo method call
      // and i'm deferring photo load method for that.
      setTimeout(this._triggerPhotoLoad.bind(this, index), 200);
    }
  }

  _onNextButtonTapped(animated = false) {
    let nextIndex = this.state.currentIndex + 1;
    // go back to the first item when there is no more next item
    if (nextIndex > this.props.dataSource.length - 1) {
      // nextIndex = 0; // 循环
      nextIndex = this.props.dataSource.length - 1;
    }
    this.openPage(nextIndex, animated);
  }

  _onPreviousButtonTapped(animated = false) {
    let prevIndex = this.state.currentIndex - 1;
    // go to the last item when there is no more previous item
    if (prevIndex < 0) {
      // prevIndex = this.props.dataSource.length - 1; //循环
      prevIndex = 0;
    }
    this.openPage(prevIndex, animated);
  }

  _onMomentumScrollBegin(e) {
    if (!this.isDragScrolling) {
      if (
        e.nativeEvent.contentOffset.x - this.scrollOffsetX >
        DRAG_SWIPE_THRESHOLD
      ) {
        this._onNextButtonTapped(true);
      } else if (
        this.scrollOffsetX - e.nativeEvent.contentOffset.x >
        DRAG_SWIPE_THRESHOLD
      ) {
        this._onPreviousButtonTapped(true);
      }
    }
  }

  _onMomentumScrollEnd(e) {
    // setTimeout(function () {
    //   this.isDragScrolling = false;
    //   this.isScrolling = false;
    // },
    //   300
    // )
    this.isDragScrolling = false;
    this.isScrolling = false;
  }

  _onScrollBeginDrag(e) {
    this.isScrolling = true;
    this.scrollOffsetX = e.nativeEvent.contentOffset.x;
  }

  _onScrollEndDrag(e) {
    if (
      e.nativeEvent.contentOffset.x - this.scrollOffsetX >
      DRAG_SWIPE_TRIGGER_THRESHOLD
    ) {
      this.isDragScrolling = true;
      this._onNextButtonTapped(true);
    } else if (
      this.scrollOffsetX - e.nativeEvent.contentOffset.x >
      DRAG_SWIPE_TRIGGER_THRESHOLD
    ) {
      this.isDragScrolling = true;
      this._onPreviousButtonTapped(true);
    } else {
      setTimeout(
        function() {
          this.openPage(this.state.currentIndex, true);
        }.bind(this),
        300
      );
    }
  }

  _showVideoIcon(item) {
    return item.isVideo ? item.isVideo : false;
    // return item.playableDuration > 0 ? true : false;
  }

  _renderItem(item, index) {
    const {
      displaySelectionButtons,
      onMediaSelection,
      toggleToolBar
    } = this.props;

    return (
      <View style={styles.flex}>
        {item ? (
          <Photo
            ref={ref => (this.mediaRefs[index] = ref)}
            uri={item.thumb || item.photo || item.video}
            displaySelectionButtons={displaySelectionButtons}
            selected={true}
            onSelection={() => {}}
            scalable={true}
            lockScrollView={this.lockScrollView}
            showVideoIcon={this._showVideoIcon(item)}
            isVideo={item.isVideo}
            onTapOnce={this._onTapOnce}
            onDoubleTap={this._onDoubleTap}
          />
        ) : (
          <View />
        )
        // <Video
        //   ref={ref => this.mediaRefs[index] = ref}
        //   useCircleProgress={useCircleProgress}
        //   uri={item.video}
        //   displaySelectionButtons={displaySelectionButtons}
        //   selected={item.selected}
        //   onSelection={(isSelected) => {
        //     onMediaSelection(index, isSelected);
        //   }}
        // />
        }
      </View>
    );
  }

  _renderScrollableContent() {
    const { dataSource } = this.props;

    // if (Platform.OS === 'android') {
    //   return (
    //     <ViewPagerAndroid
    //       style={styles.flex}
    //       ref={flatList => this.flatListRef = flatList}
    //       onPageSelected={this._onPageSelected}
    //     >
    //       {mediaList.map((child, idx) => this._renderItem(child, 0, idx))}
    //     </ViewPagerAndroid>
    //   );
    // }

    return (
      <FlatList
        ref={ref => {
          this.flatListRef = ref;
        }}
        data={dataSource}
        renderItem={({ item, index }) => this._renderItem(item, index)}
        keyExtractor={item => item.id}
        initialNumToRender={20}
        getItemLayout={this.getItemLayout}
        onMomentumScrollBegin={this._onMomentumScrollBegin}
        onMomentumScrollEnd={this._onMomentumScrollEnd}
        onScrollBeginDrag={this._onScrollBeginDrag}
        onScrollEndDrag={this._onScrollEndDrag}
        horizontal={true}
        onEndReached={false}
        scrollEnabled={this.state.scrollEnabled}
        canCancelContentTouches={true}
      />
    );
  }

  render() {
    return <View style={styles.flex}>{this._renderScrollableContent()}</View>;
  }
}

FullScreenLayout.defaultProps = {
  initialIndex: 0,
  displaySelectionButtons: false
};

FullScreenLayout.propTypes = {
  style: ViewPropTypes.style,
  dataSource: PropTypes.array.isRequired,
  updateTitle: PropTypes.func, //updates top bar title
  toggleToolBar: PropTypes.func, //displays/hides top bar
  onMediaSelection: PropTypes.func, //refresh the list to apply selection change
  initialIndex: PropTypes.number, //those props are inherited from main PhotoBrowser component i.e. index.js
  displaySelectionButtons: PropTypes.bool,
  useCircleProgress: PropTypes.bool,
  scrolledToItem: PropTypes.func, //滑动结束后，通知父级
  isFullScreen: PropTypes.bool
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center"
  }
});
