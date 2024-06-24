import React, { useContext } from 'react';
import { dequal } from 'dequal';

import { IMessageAttachments } from './interfaces';
import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import { Reply } from './components';
import Button from '../Button';
import MessageContext from './Context';
import { IAttachment, TGetCustomEmoji } from '../../definitions';
import CollapsibleQuote from './Components/CollapsibleQuote';
import openLink from '../../lib/methods/helpers/openLink';
import Markdown from '../markdown';
import { getMessageFromAttachment } from './utils';

export type TElement = {
	type: string;
	msg?: string;
	url?: string;
	text: string;
};

const AttachedActions = ({ attachment, getCustomEmoji }: { attachment: IAttachment; getCustomEmoji: TGetCustomEmoji }) => {
	const { onAnswerButtonPress } = useContext(MessageContext);

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
			<Markdown msg={attachment.text} getCustomEmoji={getCustomEmoji} />
			{attachedButtons}
		</>
	);
};

const Attachments: React.FC<IMessageAttachments> = React.memo(
	({ attachments, timeFormat, showAttachment, style, getCustomEmoji, isReply, author }: IMessageAttachments) => {
		const { translateLanguage } = useContext(MessageContext);

		if (!attachments || attachments.length === 0) {
			return null;
		}

		const attachmentsElements = attachments.map((file: IAttachment, index: number) => {
			const msg = getMessageFromAttachment(file, translateLanguage);
			if (file && file.image_url) {
				return (
					<Image
						key={file.image_url}
						file={file}
						showAttachment={showAttachment}
						getCustomEmoji={getCustomEmoji}
						style={style}
						isReply={isReply}
						author={author}
						msg={msg}
					/>
				);
			}

			if (file && file.audio_url) {
				return (
					<Audio
						key={file.audio_url}
						file={file}
						getCustomEmoji={getCustomEmoji}
						isReply={isReply}
						style={style}
						author={author}
						msg={msg}
					/>
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
						msg={msg}
					/>
				);
			}

			if (file && file.actions && file.actions.length > 0) {
				return <AttachedActions attachment={file} getCustomEmoji={getCustomEmoji} />;
			}
			if (typeof file.collapsed === 'boolean') {
				return (
					<CollapsibleQuote key={index} index={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} />
				);
			}

			return (
				<Reply
					key={index}
					index={index}
					attachment={file}
					timeFormat={timeFormat}
					getCustomEmoji={getCustomEmoji}
					msg={msg}
					showAttachment={showAttachment}
				/>
			);
		});
		return <>{attachmentsElements}</>;
	},
	(prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments)
);

Attachments.displayName = 'MessageAttachments';

export default Attachments;
