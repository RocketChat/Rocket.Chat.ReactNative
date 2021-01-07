import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';
import isEqual from 'deep-equal';
import FastImage from '@rocket.chat/react-native-fast-image';
import Touchable from './Touchable';
import Markdown from '../markdown';
import openLink from '../../utils/openLink';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import MessageContext from './Context';

const VideoThumbnails = require('expo-video-thumbnails'); // es6 import was giving error with jest

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = type => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	button: {
		flex: 1,
		borderRadius: 4,
		marginBottom: 6
	},
	thumbnailStyles: {
		width: '100%',
		minHeight: isTablet ? 300 : 200,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center'
	},
	loaderStyles: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		right: 0,
		left: 0
	}
});

const Video = React.memo(({
	file, showAttachment, getCustomEmoji, theme
}) => {
	const [image, setImage] = useState(null);
	const { baseUrl, user } = useContext(MessageContext);
	if (!baseUrl) {
		return null;
	}
	const onPress = () => {
		if (isTypeSupported(file.video_type)) {
			return showAttachment(file);
		}
		const uri = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);
		openLink(uri, theme);
	};

	const fetchThumbnail = async() => {
		if (isTypeSupported(file.video_type)) {
			const uri_ = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);

			const { uri } = await VideoThumbnails.getThumbnailAsync(
				uri_
			);
			setImage(uri);
		}
	};
	useEffect(() => {
		fetchThumbnail();
	}, []);
	return (
		<>
			<Touchable
				onPress={onPress}
				style={[styles.button]}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
			>
				<View>
					<FastImage
						source={{ uri: image }}
						style={styles.thumbnailStyles}
						resizeMode='contain'
					>
						<View>
							<CustomIcon
								name='play-filled'
								size={54}
								color={themes[theme].buttonText}
							/>
						</View>


					</FastImage>
				</View>

			</Touchable>
			<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
		</>
	);
}, (prevProps, nextProps) => isEqual(prevProps.file, nextProps.file) && prevProps.theme === nextProps.theme);

Video.propTypes = {
	file: PropTypes.object,
	showAttachment: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};

export default Video;
