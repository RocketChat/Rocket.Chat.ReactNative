import React, { useContext } from 'react';
import { dequal } from 'dequal';
import { View } from 'react-native';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import CollapsibleQuote from './CollapsibleQuote';
import AttachedActions from './AttachedActions';
import MessageContext from '../../Context';
import { IMessageAttachments } from '../../interfaces';
import { IAttachment } from '../../../../definitions';
import { getMessageFromAttachment } from '../../utils';

const removeQuote = (file?: IAttachment) =>
	file?.image_url || file?.audio_url || file?.video_url || (file?.actions?.length || 0) > 0 || file?.collapsed;

const Attachments: React.FC<IMessageAttachments> = React.memo(
	({ attachments, timeFormat, showAttachment, getCustomEmoji, author }: IMessageAttachments) => {
		'use memo';

		const { translateLanguage } = useContext(MessageContext);

		const nonQuoteAttachments = attachments?.filter(removeQuote);

		if (!nonQuoteAttachments || nonQuoteAttachments.length === 0) {
			return null;
		}

		const attachmentsElements = nonQuoteAttachments.map((file: IAttachment, index: number) => {
			const msg = getMessageFromAttachment(file, translateLanguage);
			if (file && file.image_url) {
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

			if (file && file.audio_url) {
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

			if (file && file.actions && file.actions.length > 0) {
				return <AttachedActions attachment={file} getCustomEmoji={getCustomEmoji} />;
			}
			if (typeof file.collapsed === 'boolean') {
				return <CollapsibleQuote key={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} />;
			}

			return null;
		});
		return <View style={{ gap: 4 }}>{attachmentsElements}</View>;
	},
	(prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments)
);

Attachments.displayName = 'MessageAttachments';

export default Attachments;
