import React, { Component } from "react";
import { CameraRoll } from "react-native";
import PropTypes from "prop-types";

import MediaGridBrowser from "../components/MediaGridBrowser";

export default class MediaGridBrowserContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mediaMap: new Map(),
      after: null,
      has_next_page: true
    };

    this.getPhotos();
  }

  // groupTypes: 'All', groupName: 'Test1'
  getPhotos = () => {
    let params = { first: 3000, groupTypes: "All", assetType: "All" };
    if (this.state.after) params.after = this.state.after;
    if (!this.state.has_next_page) return;
    CameraRoll.getPhotos(params).then(this.processPhotos);
  };

  processPhotos = r => {
    if (this.state.after === r.page_info.end_cursor) {
      return;
    }

    let nodes = r.edges.map(i => i.node);
    var { mediaMap } = this.state;
    nodes.forEach(node => {
      // 组装用于显示的单个media json信息
      let media = {};
      media.caption = node.image.filename;
      media.playableDuration = node.image.playableDuration;
      media.photo = node.image.uri;
      media.width = node.image.width;
      media.height = node.image.height;
      media.isVideo = node.image.playableDuration > 0 ? true : false;
      //"assets-library://asset/asset.JPG?id=99D53A1F-FEEF-40E1-8BB3-7DD55A43C8B7&ext=JPG"
      var substr = node.image.uri.match(/id=(\S*)&ext/);
      media.id = substr[1];

      // 组装单个gruop_name的medias信息
      let mediaArrayInGroup = mediaMap.get(node.group_name)
        ? mediaMap.get(node.group_name)
        : [];
      mediaArrayInGroup.push(media);

      mediaMap.set(node.group_name, mediaArrayInGroup);
    });

    this.setState({
      mediaMap: mediaMap,
      after: r.page_info.end_cursor,
      has_next_page: r.page_info.has_next_page
    });

    // 通过设置nav的params将list显示相册信息传递过去
    this.props.navigation.state.params.setMediaGroupList(
      this.prepareMediaGroupList(mediaMap)
    ); //Array.from(mediaMap.keys())
  };

  // 组装用于显示PhoneMediaList的数据（[{key: value}]）
  prepareMediaGroupList = mediaMap => {
    var mediaGroupList = [];
    mediaMap.forEach((value, key, map) => {
      mediaGroupList.push({ key: key, value: value[0], count: value.length });
    });
    return mediaGroupList;
  };

  // 对于为分类的情况，显示全部的media
  getMediaList = () => {
    var mediaList = [];
    var mediaIdList = []; //用于记录id，判断是否存在
    for (let medias of this.state.mediaMap) {
      for (let media of medias[1]) {
        if (mediaIdList.indexOf(media.id) < 0) {
          mediaList.push(media);
          mediaIdList.push(media.id);
        }
      }
    }
    return mediaList;
  };

  _checkFileTypeVideo = item => {
    return item.playableDuration > 0 ? true : false;
  };

  render() {
    const medias = this.props.groupName
      ? this.state.mediaMap.get(this.props.groupName)
      : this.getMediaList();
    const { leftButtonText, middleButtonText, rightButtonText } = this.props;
    // const medias = this.state.mediaMap.get(this.props.groupName);
    return (
      <MediaGridBrowser
        ref={ref => (this.mediaGridBrowserRef = ref)}
        mediaList={medias ? medias : []}
        displayNavArrows={true}
        displaySelectionButtons={true}
        alwaysDisplayStatusBar={true}
        displayBottomBar={true}
        onEndReached={this.getPhotos}
        checkFileTypeVideo={this._checkFileTypeVideo}
        leftButtonPressed={this.props.leftButtonPressed}
        rightButtonPressed={this.props.rightButtonPressed}
        leftButtonText={leftButtonText}
        middleButtonText={middleButtonText}
        rightButtonText={rightButtonText}
      />
    );
  }
}

MediaGridBrowserContainer.defaultProps = {
  groupName: "Camera Roll"
};

MediaGridBrowserContainer.propTypes = {
  groupName: PropTypes.string
};
