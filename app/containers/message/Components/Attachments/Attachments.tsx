import React, { useContext } from 'react';
import { dequal } from 'dequal';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import { Reply } from './components';
import CollapsibleQuote from './CollapsibleQuote';
import AttachedActions from './AttachedActions';
import MessageContext from '../../Context';
import { IMessageAttachments } from '../../interfaces';
import { IAttachment } from '../../../../definitions';
import { getMessageFromAttachment } from '../../utils';

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
						author={author}
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
