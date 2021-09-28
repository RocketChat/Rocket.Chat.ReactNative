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
                    width:'100%',
                    height:'100%'
                }}>
                   <WebView
                   allowsFullscreenVideo
                   allowsInlineMediaPlayback
                   mediaPlaybackRequiresUserAction
                   javaScriptEnabled
                   domStorageEnabled
                    source={{html:`<iframe width="100%" height="80%" src=${videoUrl}  frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` }}
                   />
     
                </View>
                
            </View>
        )
    }
   
}

export default VideoPlayerView