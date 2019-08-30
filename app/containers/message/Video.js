import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import isEqual from 'deep-equal';

import Markdown from '../markdown';
import openLink from '../../utils/openLink';
import { isIOS } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { formatAttachmentUrl } from '../../lib/utils';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = type => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	button: {
		flex: 1,
		borderRadius: 4,
		height: 150,
		backgroundColor: '#1f2329',
		marginBottom: 6,
		alignItems: 'center',
		justifyContent: 'center'
	},
	modal: {
		margin: 0,
		backgroundColor: '#000'
	},
	image: {
		color: 'white'
	}
});

const Video = React.memo(({
	file, baseUrl, user, useMarkdown, onOpenFileModal, getCustomEmoji
}) => {
	if (!baseUrl) {
		return null;
	}

	const onPress = () => {
		if (isTypeSupported(file.video_type)) {
			return onOpenFileModal(file);
		}
		const uri = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);
		openLink(uri);
	};

	return (
		<React.Fragment>
			<Touchable
				onPress={onPress}
				style={styles.button}
				background={Touchable.Ripple('#fff')}
			>
				<CustomIcon
					name='play'
					size={54}
					style={styles.image}
				/>
			</Touchable>
			<Markdown msg={file.description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} useMarkdown={useMarkdown} />
		</React.Fragment>
	);
}, (prevProps, nextProps) => isEqual(prevProps.file, nextProps.file));

Video.propTypes = {
	file: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	useMarkdown: PropTypes.bool,
	onOpenFileModal: PropTypes.func,
	getCustomEmoji: PropTypes.func
};

export default Video;
