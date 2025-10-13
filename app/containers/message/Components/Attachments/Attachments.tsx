import React, { useContext } from 'react';
import { dequal } from 'dequal';
import { View } from 'react-native';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import CollapsibleQuote from './CollapsibleQuote';
import AttachedActions from './AttachedActions';
import LiveLocationAttachment from './LiveLocationAttachment';
import MessageContext from '../../Context';
import { IMessageAttachments } from '../../interfaces';
import { IAttachment } from '../../../../definitions';
import { getMessageFromAttachment } from '../../utils';

const removeQuote = (file?: IAttachment) =>
	file?.image_url || file?.audio_url || file?.video_url || (file?.actions?.length || 0) > 0 || file?.collapsed || file?.type === 'live-location';

const Attachments: React.FC<IMessageAttachments> = React.memo(
  
	({ attachments, timeFormat, showAttachment, style, getCustomEmoji, isReply, author, messageId, roomId }: IMessageAttachments) => {
		'use memo';
  
		const { translateLanguage } = useContext(MessageContext);

		console.log('🔍 [Attachments] Processing attachments:', attachments?.length || 0);
		if (attachments) {
			attachments.forEach((att, idx) => {
				console.log(`🔍 [Attachments] Attachment ${idx}:`, {
					type: att.type,
					hasLive: !!(att as any).live,
					keys: Object.keys(att)
				});
			});
		}

		const nonQuoteAttachments = attachments?.filter(removeQuote);

		console.log('🔍 [Attachments] Non-quote attachments:', nonQuoteAttachments?.length || 0);

		if (!nonQuoteAttachments || nonQuoteAttachments.length === 0) {
			console.log('🔍 [Attachments] No attachments to render');
			return null;
		}
		// TODO: memo?
		const attachmentsElements = nonQuoteAttachments.map((file: IAttachment, index: number) => {
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
						imagePreview={file.image_preview}
						imageType={file.image_type}
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
				return <CollapsibleQuote key={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} />;
			}

			// Handle live location attachments
			console.log('🔍 [Attachments] Checking file:', { type: file.type, hasLive: !!(file as any).live });
			if (file.type === 'live-location' && (file as any).live) {
				console.log('✅ [Attachments] Rendering LiveLocationAttachment!');
				return (
					<LiveLocationAttachment
						key={`live-location-${index}`}
						attachment={file as any}
						getCustomEmoji={getCustomEmoji}
						showAttachment={showAttachment}
						style={style}
						isReply={isReply}
						author={author}
						messageId={messageId}
						roomId={roomId}
					/>
				);
			}

			return null;
		});
		return <View style={{ gap: 4 }}>{attachmentsElements}</View>;
	},
	(prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments)
);

Attachments.displayName = 'MessageAttachments';

export default Attachments;
