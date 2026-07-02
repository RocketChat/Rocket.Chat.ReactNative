import { type FC } from 'react';
import { View } from 'react-native';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import CollapsibleQuote from './CollapsibleQuote';
import AttachedActions from './AttachedActions';
import Reply from './Reply';
import { useShowAttachment, useGetCustomEmoji } from '../../MessageRoomStore';
import { useContentData, useTranslateLanguage } from '../../MessageStore';
import { type IMessageAttachments } from '../../interfaces';
import { getMessageFromAttachment } from '../../utils';
import { isContentAttachment } from './utils';

const Attachments: FC<IMessageAttachments> = ({ attachments, author }: IMessageAttachments) => {
	'use memo';

	const translateLanguage = useTranslateLanguage();
	const showAttachment = useShowAttachment();
	const getCustomEmoji = useGetCustomEmoji() ?? (() => null);
	const { attachments: storeAttachments } = useContentData();
	const resolved = attachments ?? storeAttachments;

	const nonQuoteAttachments = resolved?.filter(isContentAttachment);

	if (!nonQuoteAttachments || nonQuoteAttachments.length === 0) {
		return null;
	}

	const attachmentsElements = nonQuoteAttachments.map((file, index) => {
		const msg = getMessageFromAttachment(file, translateLanguage);

		if (file.image_url) {
			return (
				<Image
					key={file.image_url}
					file={file}
					showAttachment={showAttachment}
					getCustomEmoji={getCustomEmoji}
					author={author}
					msg={msg}
					imagePreview={file.image_preview}
					imageType={file.image_type}
				/>
			);
		}

		if (file.audio_url) {
			return <Audio key={file.audio_url} file={file} getCustomEmoji={getCustomEmoji} author={author} msg={msg} />;
		}

		if (file.video_url) {
			return (
				<Video
					key={file.video_url}
					file={file}
					showAttachment={showAttachment}
					getCustomEmoji={getCustomEmoji}
					author={author}
					msg={msg}
				/>
			);
		}

		if (file.actions && file.actions.length > 0) {
			return (
				<AttachedActions
					key={file.title_link || file.message_link || `actions-${index}`}
					attachment={file}
					getCustomEmoji={getCustomEmoji}
				/>
			);
		}
		if (typeof file.collapsed === 'boolean') {
			return (
				<CollapsibleQuote
					key={file.title_link || file.message_link || `collapsible-${index}`}
					attachment={file}
					getCustomEmoji={getCustomEmoji}
				/>
			);
		}

		if (file.attachments?.length) {
			return (
				<Reply
					key={file.title_link || file.message_link || `reply-${index}`}
					attachment={file}
					getCustomEmoji={getCustomEmoji}
					msg={msg}
				/>
			);
		}

		return null;
	});

	return <View style={{ gap: 4 }}>{attachmentsElements}</View>;
};

Attachments.displayName = 'MessageAttachments';

export default Attachments;
