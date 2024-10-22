import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import PropTypes from 'prop-types';
import * as HeaderButton from '../../containers/HeaderButton';

class VideoPlayerView extends React.Component {
	static propTypes = {
		route: PropTypes.object
	};

	static navigationOptions = ({ navigation, isMasterDetail }) => {
		const options = {
			title: 'Video'
		};
		if (!isMasterDetail) {
			options.headerLeft = () => <HeaderButton.Drawer navigation={navigation} />;
		}
		return options;
	};

	render() {
		const { route } = this.props;
		const { videoUrl } = route.params;

		return (
			<View
				style={{
					flex: 1
				}}
			>
				<View
					style={{
						width: '100%',
						height: '100%'
					}}
				>
					<WebView
						allowsFullscreenVideo
						allowsInlineMediaPlayback
						mediaPlaybackRequiresUserAction={false}
						javaScriptEnabled
						domStorageEnabled
						source={{
							html: `<iframe width="100%" height="80%" src=${videoUrl}  frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
						}}
					/>
				</View>
			</View>
		);
	}
}

export default VideoPlayerView;
