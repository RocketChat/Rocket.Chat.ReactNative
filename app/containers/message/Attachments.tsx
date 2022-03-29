import React, { useContext } from 'react';
import { dequal } from 'dequal';
import { Text } from 'react-native';

import { IMessageAttachments, IMessageAttachedActions } from './interfaces';
import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import Reply from './Reply';
import Button from '../Button';
import styles from './styles';
import MessageContext from './Context';
import { useTheme } from '../../theme';
import { IAttachment } from '../../definitions';
import CollapsibleQuote from './Components/CollapsibleQuote';

const AttachedActions = ({ attachment }: IMessageAttachedActions) => {
	if (!attachment.actions) {
		return null;
	}
	const { onAnswerButtonPress } = useContext(MessageContext);
	const { theme } = useTheme();

	const attachedButtons = attachment.actions.map((element: { type: string; msg: string; text: string }) => {
		if (element.type === 'button') {
			return <Button theme={theme} onPress={() => onAnswerButtonPress(element.msg)} title={element.text} />;
		}
		return null;
	});
	return (
		<>
			<Text style={styles.text}>{attachment.text}</Text>
			{attachedButtons}
		</>
	);
};

const Attachments = React.memo(
	// @ts-ignore
	({ attachments, timeFormat, showAttachment, style, getCustomEmoji, isReply }: IMessageAttachments) => {
		if (!attachments || attachments.length === 0) {
			return null;
		}

		const { theme } = useTheme();

		return attachments.map((file: IAttachment, index: number) => {
			if (file && file.image_url) {
				return (
					<Image
						key={file.image_url}
						file={file}
						showAttachment={showAttachment}
						getCustomEmoji={getCustomEmoji}
						style={style}
						isReply={isReply}
					/>
				);
			}

			if (file && file.audio_url) {
				return (
					<Audio key={file.audio_url} file={file} getCustomEmoji={getCustomEmoji} isReply={isReply} style={style} theme={theme} />
				);
			}

			if (file.video_url) {
				return (
					<Video
						key={file.video_url}
						file={file}
						showAttachment={showAttachment}
						getCustomEmoji={getCustomEmoji}
						style={style}
						isReply={isReply}
						theme={theme}
					/>
				);
			}

			if (file && file.actions && file.actions.length > 0) {
				return <AttachedActions attachment={file} />;
			}
			if (typeof file.collapsed === 'boolean') {
				return (
					<CollapsibleQuote key={index} index={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} />
				);
			}

			return <Reply key={index} index={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} />;
		});
	},
	(prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments)
);

Attachments.displayName = 'MessageAttachments';

export default Attachments;
