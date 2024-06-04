import React from 'react';
import convertToProxyURL from 'react-native-video-cache';
// @ts-ignore
import Video from 'react-native-video';

const FocusableVideo = ({ source, isFocused, onError, videoStyle, posterUri }) => {
    
    return (
        <Video
            source={{ uri: convertToProxyURL(source)}}
            style={videoStyle}
            controls={true}
            resizeMode="cover"
            onError={onError}
            paused={!isFocused}  // 根据isFocused状态控制视频播放或暂停
            poster={convertToProxyURL(posterUri)}
        />
    );
};



export default FocusableVideo;
