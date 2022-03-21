import React, { useContext } from 'react';
import { dequal } from 'dequal';
import { Text } from 'react-native';

import { IMessageAttachments } from './interfaces';
import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import Reply from './Reply';
import Button from '../Button';
import styles from './styles';
import MessageContext from './Context';
import CollapsibleQuote from './Components/CollapsibleQuote';
import { IAttachment } from '../../definitions';

const AttachedActions = ({ attachment, theme }: { attachment: IAttachment; theme: string }) => {
	const { onAnswerButtonPress } = useContext(MessageContext);

	const attachedButtons = attachment?.actions?.map(element => {
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
	// TODO - change this any to React.ReactElement[] | null
	({ attachments, timeFormat, showAttachment, getCustomEmoji, theme }: IMessageAttachments): any => {
		if (!attachments || attachments.length === 0) {
			return null;
		}

		return attachments.map((file: IAttachment, index: number) => {
			if (file.image_url) {
				return <Image key={file.image_url} file={file} showAttachment={showAttachment} getCustomEmoji={getCustomEmoji} />;
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
