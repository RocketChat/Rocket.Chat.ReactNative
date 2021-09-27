import React from 'react';
import { StyleSheet, Text, View,Dimensions} from 'react-native';
import { WebView } from 'react-native-webview';
import { DrawerButton } from '../../containers/HeaderButton';

class VideoPlayerView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => {
		const options = {
			title: 'Video'
		};
		if (!isMasterDetail) {
			options.headerLeft = () => <DrawerButton navigation={navigation} />;
		}
		return options;
	}
     
    render(){
        const {videoUrl} = this.props.route.params;
       
        return(
            <View style={{
                 flex:1,
             }}>
                <View style={{
                    width:"100%",
                    height:"100%"
                }}>
                   <WebView
                   allowsFullscreenVideo
                   allowsInlineMediaPlayback
                   mediaPlaybackRequiresUserAction
                   javaScriptEnabled
                   domStorageEnabled
                    source={{uri:videoUrl}}
                   />
     
                </View>
                
            </View>
        )
    }
   
}

export default VideoPlayerView