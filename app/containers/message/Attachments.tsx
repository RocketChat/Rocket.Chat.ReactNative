import React, { useContext } from 'react';
import { dequal } from 'dequal';
import { Text } from 'react-native';

import { IMessageAttachments } from './interfaces';
import Image from './Image';
import Audio from './Components/Audio';
import Video from './Video';
import Reply from './Reply';
import Button from '../Button';
import styles from './styles';
import MessageContext from './Context';
import { useTheme } from '../../theme';
import { IAttachment } from '../../definitions';
import CollapsibleQuote from './Components/CollapsibleQuote';
import openLink from '../../lib/methods/helpers/openLink';
import { themes } from '../../lib/constants';

export type TElement = {
	type: string;
	msg?: string;
	url?: string;
	text: string;
};

const AttachedActions = ({ attachment }: { attachment: IAttachment }) => {
	const { onAnswerButtonPress } = useContext(MessageContext);
	const { theme } = useTheme();

	if (!attachment.actions) {
		return null;
	}

	const attachedButtons = attachment.actions.map((element: TElement) => {
		const onPress = () => {
			if (element.msg) {
				onAnswerButtonPress(element.msg);
			}

			if (element.url) {
				openLink(element.url);
			}
		};

		if (element.type === 'button') {
			return <Button onPress={onPress} title={element.text} />;
		}

		return null;
	});
	return (
		<>
			<Text style={[styles.text, { color: themes[theme].bodyText }]}>{attachment.text}</Text>
			{attachedButtons}
		</>
	);
};

const Attachments: React.FC<IMessageAttachments> = React.memo(
	({ attachments, timeFormat, showAttachment, style, getCustomEmoji, isReply }: IMessageAttachments) => {
		const { theme } = useTheme();

		if (!attachments || attachments.length === 0) {
			return null;
		}

		const attachmentsElements = attachments.map((file: IAttachment, index: number) => {
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
		return <>{attachmentsElements}</>;
	},
	(prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments)
);

Attachments.displayName = 'MessageAttachments';

export default Attachments;
