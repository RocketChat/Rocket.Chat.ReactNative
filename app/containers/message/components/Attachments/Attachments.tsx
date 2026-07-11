import { type FC } from 'react';
import { View } from 'react-native';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import CollapsibleQuote from './CollapsibleQuote';
import AttachedActions from './AttachedActions';
import Reply from './Reply';
import { useShowAttachment } from '../../stores/MessageRoomStore';
import { useTranslateLanguage } from '../../stores/MessageStore';
import { type IMessageAttachments } from '../../interfaces';
import { getMessageFromAttachment } from '../../utils';
import { getAttachmentKey, isContentAttachment } from './utils';

const Attachments: FC<IMessageAttachments> = ({ attachments, author }: IMessageAttachments) => {
	'use memo';

	const translateLanguage = useTranslateLanguage();
	const showAttachment = useShowAttachment();

	const nonQuoteAttachments = attachments?.filter(isContentAttachment);

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
					author={author}
					msg={msg}
					imagePreview={file.image_preview}
					imageType={file.image_type}
				/>
			);
		}

		if (file.audio_url) {
			return <Audio key={file.audio_url} file={file} author={author} msg={msg} />;
		}

		if (file.video_url) {
			return <Video key={file.video_url} file={file} showAttachment={showAttachment} author={author} msg={msg} />;
		}

		if (file.actions && file.actions.length > 0) {
			return <AttachedActions key={getAttachmentKey(file, 'actions', index)} attachment={file} />;
		}
		if (typeof file.collapsed === 'boolean') {
			return <CollapsibleQuote key={getAttachmentKey(file, 'collapsible', index)} attachment={file} />;
		}

		if (file.attachments?.length) {
			return <Reply key={getAttachmentKey(file, 'reply', index)} attachment={file} msg={msg} />;
		}

		return null;
	});

	return <View style={{ gap: 4 }}>{attachmentsElements}</View>;
};

export default Attachments;
