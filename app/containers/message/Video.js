import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';
import { dequal } from 'dequal';

import Touchable from './Touchable';
import Markdown from '../markdown';
import openLink from '../../utils/openLink';
import { isIOS } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import MessageContext from './Context';
import { MessageImage } from './Image';


const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = type => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	button: {
		flex: 1,
		borderRadius: 4,
		minHeight: 150,
		marginBottom: 6,
		alignItems: 'center',
		justifyContent: 'center'
	},
	play: {
		position: 'absolute',
		alignSelf: 'center'
	},
	containerVideo: {
		width: '100%',
		justifyContent: 'center'
	}
});

const Video = React.memo(({
	file, showAttachment, getCustomEmoji, theme
}) => {
	const { baseUrl, user } = useContext(MessageContext);
	let img;
	if (file.image_preview) {
		img = formatAttachmentUrl(file.image_preview, user.id, user.token, baseUrl);
	}
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


	return (
		<>
			<Touchable
				onPress={onPress}
				style={[styles.button, { backgroundColor: themes[theme].videoBackground }]}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
			>
				<View style={styles.containerVideo}>
					<MessageImage img={img} theme={theme} />
					<CustomIcon
						style={styles.play}
						name='play-filled'
						size={54}
						color={themes[theme].buttonText}
					/>
				</View>
			</Touchable>
			<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
		</>
	);
}, (prevProps, nextProps) => dequal(prevProps.file, nextProps.file) && prevProps.theme === nextProps.theme);

Video.propTypes = {
	file: PropTypes.object,
	showAttachment: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};

export default Video;
