import React from 'react';
import { dequal } from 'dequal';
import PropTypes from 'prop-types';
import { Button, Text } from 'react-native';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import Reply from './Reply';
import RocketChat from '../../lib/rocketchat';
import defaultStyle from '../markdown/styles';

const AttachedActions = ({ user, rid, attachment }) => {
	const onButtonPress = async(msg) => {
		try {
			await RocketChat.sendMessage(rid, msg, undefined, user, false);
		} catch (e) {
			// Do nothing
		}
	};
	const attachedButtons = attachment.actions.map((element) => {
		if (element.type === 'button') {
			return <Button onPress={() => onButtonPress(element.msg)} title={element.text} />;
		}	else {
			return null;
		}
	});
	return (
		<>
			<Text style={defaultStyle.heading6}>{attachment.text}</Text>
			{attachedButtons}
		</>
	);
};

const Attachments = React.memo(({
	attachments, timeFormat, showAttachment, getCustomEmoji, theme, rid, user
}) => {
	if (!attachments || attachments.length === 0) {
		return null;
	}

	return attachments.map((file, index) => {
		if (file.image_url) {
			return <Image key={file.image_url} file={file} showAttachment={showAttachment} getCustomEmoji={getCustomEmoji} theme={theme} />;
		}
		if (file.audio_url) {
			return <Audio key={file.audio_url} file={file} getCustomEmoji={getCustomEmoji} theme={theme} />;
		}
		if (file.video_url) {
			return <Video key={file.video_url} file={file} showAttachment={showAttachment} getCustomEmoji={getCustomEmoji} theme={theme} />;
		}
		if (file.actions && file.actions.length > 0) {
			return <AttachedActions attachment={file} user={user} rid={rid} />;
		}

		// eslint-disable-next-line react/no-array-index-key
		return <Reply key={index} index={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} theme={theme} />;
	});
}, (prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments) && prevProps.theme === nextProps.theme);

Attachments.propTypes = {
	attachments: PropTypes.array,
	timeFormat: PropTypes.string,
	showAttachment: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string,
	rid: PropTypes.string,
	user: PropTypes.shape({
		id: PropTypes.string.isRequired,
		username: PropTypes.string.isRequired,
		token: PropTypes.string.isRequired
	})
};
Attachments.displayName = 'MessageAttachments';
AttachedActions.propTypes = {
	attachment: PropTypes.shape({
		actions: PropTypes.array,
		text: PropTypes.string
	}),
	user: PropTypes.shape({
		id: PropTypes.string.isRequired,
		username: PropTypes.string.isRequired,
		token: PropTypes.string.isRequired
	}),
	rid: PropTypes.string
};

export default Attachments;
