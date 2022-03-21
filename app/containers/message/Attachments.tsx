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
import CollapsibleQuote from './Components/CollapsibleQuote';

const AttachedActions = ({ attachment, theme }: IMessageAttachedActions) => {
	const { onAnswerButtonPress } = useContext(MessageContext);

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
	({ attachments, timeFormat, showAttachment, getCustomEmoji, theme }: IMessageAttachments) => {
		if (!attachments || attachments.length === 0) {
			return null;
		}

		return attachments.map((file: any, index: number) => {
			if (file.image_url) {
				return (
					<Image key={file.image_url} file={file} showAttachment={showAttachment} getCustomEmoji={getCustomEmoji} theme={theme} />
				);
			}
			if (file.audio_url) {
				return <Audio key={file.audio_url} file={file} getCustomEmoji={getCustomEmoji} theme={theme} />;
			}
			if (file.video_url) {
				return (
					<Video key={file.video_url} file={file} showAttachment={showAttachment} getCustomEmoji={getCustomEmoji} theme={theme} />
				);
			}
			if (file.actions && file.actions.length > 0) {
				return <AttachedActions attachment={file} theme={theme} />;
			}
			if (file.title)
				return (
					<CollapsibleQuote key={index} index={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} />
				);

			return (
				<Reply
					key={index}
					index={index}
					attachment={file}
					timeFormat={timeFormat}
					getCustomEmoji={getCustomEmoji}
					theme={theme}
				/>
			);
		});
	},
	(prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments) && prevProps.theme === nextProps.theme
);

Attachments.displayName = 'MessageAttachments';

export default Attachments;
