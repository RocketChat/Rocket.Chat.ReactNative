import React, { useContext, useRef } from 'react';
import { dequal } from 'dequal';
import Share from 'react-native-share';
import { View, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';

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
		const viewShotRef = useRef<ViewShot>(null);

		if (!attachments || attachments.length === 0) {
			return null;
		}

		const handleShareImage = async (imageRef: React.RefObject<ViewShot>) => {
			try {
				if (typeof imageRef === 'undefined') {
					return;
				}

				if (imageRef && imageRef.current) {
					// Capture the image
					const uri = await imageRef.current.capture({
						format: 'jpg',
						quality: 0.8,
						result: Platform.OS === 'ios' ? 'base64' : 'data-uri'
					});

					let shareOptions;

					if (Platform.OS === 'ios') {
						// For iOS, we need to properly format the base64 string
						shareOptions = {
							url: `data:image/jpeg;base64,${uri}`,
							type: 'image/jpeg',
							failOnCancel: false
						};
					} else {
						// For Android, we can use the data-uri directly
						shareOptions = {
							url: uri,
							type: 'image/jpeg',
							failOnCancel: false
						};
					}

					await Share.open(shareOptions);
				}
			} catch (error) {
				console.error('Error capturing or sharing image:', error);
				// Log more detailed error information
				if (error instanceof Error) {
					console.error('Error details:', {
						message: error.message,
						stack: error.stack
					});
				}
			}
		};

		const renderImage = (file: IAttachment, msg: any) => (
			<ViewShot ref={viewShotRef}>
				<View>
					<Image
						onLongPress={() => handleShareImage(viewShotRef)}
						file={file}
						showAttachment={showAttachment}
						getCustomEmoji={getCustomEmoji}
						style={style}
						isReply={isReply}
						author={author}
						msg={msg}
					/>
				</View>
			</ViewShot>
		);

		const attachmentsElements = attachments.map((file: IAttachment, index: number) => {
			const msg = getMessageFromAttachment(file, translateLanguage);

			if (file && file.image_url) {
				return renderImage(file, msg);
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
