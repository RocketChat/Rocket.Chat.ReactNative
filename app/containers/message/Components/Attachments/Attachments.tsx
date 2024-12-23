import React, { useContext, useRef, useState } from 'react';
import { dequal } from 'dequal';
import Share from 'react-native-share';
import { View, Platform, Alert, Text, TouchableOpacity } from 'react-native';
import { captureRef } from 'react-native-view-shot';

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
		// Change ref type to View
		const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
		const viewShotRef = useRef<View>(null);

		if (!attachments || attachments.length === 0) {
			return null;
		}

		const handleShareVideo = async (originalUrl: string, videoType: string | undefined) => {
			const videoUrl = videoUrls[originalUrl];

			if (!videoUrl) {
				Alert.alert('Error', 'Video URL not found');
				return;
			}

			if (typeof videoType === 'undefined') {
				Alert.alert('Error', 'Invalid video type');
				return;
			}

			try {
				const shareOptions = {
					url: videoUrl,
					type: `video/${videoType}`,
					failOnCancel: false
				};
				await Share.open(shareOptions);
			} catch (error) {
				console.error('Error sharing video:', error);
				Alert.alert('Error', 'Failed to share video');
			}
		};

		const handleShareImage = async () => {
			try {
				if (viewShotRef.current) {
					// Use captureRef instead of capture
					const uri = await captureRef(viewShotRef, {
						format: 'jpg',
						quality: 0.8,
						result: Platform.OS === 'ios' ? 'base64' : 'data-uri'
					});

					let shareOptions;

					if (Platform.OS === 'ios') {
						shareOptions = {
							url: `data:image/jpeg;base64,${uri}`,
							type: 'image/jpeg',
							failOnCancel: false
						};
					} else {
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
				if (error instanceof Error) {
					console.error('Error details:', {
						message: error.message,
						stack: error.stack
					});
				}
			}
		};

		const renderImage = (file: IAttachment, msg: any) => (
			// Use View instead of ViewShot and add key prop
			<View ref={viewShotRef} key={file.image_url} style={{ backgroundColor: 'white' }}>
				<Image
					onLongPress={handleShareImage}
					file={file}
					showAttachment={showAttachment}
					getCustomEmoji={getCustomEmoji}
					style={style}
					isReply={isReply}
					author={author}
					msg={msg}
				/>
			</View>
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
					<View key={file.video_url}>
						<TouchableOpacity
							onPress={() => handleShareVideo(file.video_url!, file.video_type)}
							style={{
								position: 'absolute',
								bottom: 20,
								right: 20,
								zIndex: 2,
								backgroundColor: '#007bff', // Blue background
								paddingVertical: 10,
								paddingHorizontal: 20,
								borderRadius: 10,
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.3,
								shadowRadius: 5,
								elevation: 5 // For Android shadow
							}}>
							<Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Share</Text>
						</TouchableOpacity>
						<Video
							file={file}
							showAttachment={showAttachment}
							getCustomEmoji={getCustomEmoji}
							style={style}
							isReply={isReply}
							author={author}
							msg={msg}
							setUrls={setVideoUrls}
							urls={videoUrls}
						/>
					</View>
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
