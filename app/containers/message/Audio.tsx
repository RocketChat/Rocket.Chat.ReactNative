import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';

import Markdown from '../markdown';
import MessageContext from './Context';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../definitions';
import { downloadMediaFile, getMediaCache } from '../../lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '../../lib/methods/autoDownloadPreference';
import AudioPlayer from '../AudioPlayer';
import { useAppSelector } from '../../lib/hooks';

interface IMessageAudioProps {
	file: IAttachment;
	isReply?: boolean;
	style?: StyleProp<TextStyle>[];
	getCustomEmoji: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
	cdnPrefix?: string;
}

const MessageAudio = ({ file, getCustomEmoji, author, isReply, style, msg }: IMessageAudioProps) => {
	const [loading, setLoading] = useState(true);
	const [cached, setCached] = useState(false);
	const [fileUri, setFileUri] = useState('');

	const { baseUrl, user } = useContext(MessageContext);

	const { cdnPrefix } = useAppSelector(state => ({
		cdnPrefix: state.settings.CDN_PREFIX as string
	}));

	const getUrl = () => {
		let url = file.audio_url;
		if (url && !url.startsWith('http')) {
			url = `${cdnPrefix || baseUrl}${file.audio_url}`;
		}
		return url;
	};

	const onPress = () => {
		if (!cached) {
			handleDownload();
		}
	};

	const handleDownload = async () => {
		setLoading(true);
		try {
			const url = getUrl();
			if (url) {
				const audio = await downloadMediaFile({
					downloadUrl: `${url}?rc_uid=${user.id}&rc_token=${user.token}`,
					type: 'audio',
					mimeType: file.audio_type
				});
				setFileUri(audio);
				setLoading(false);
				setCached(true);
			}
		} catch {
			setLoading(false);
			setCached(false);
		}
	};

	const handleAutoDownload = async () => {
		const url = getUrl();
		try {
			if (url) {
				const isCurrentUserAuthor = author?._id === user.id;
				const isAutoDownloadEnabled = fetchAutoDownloadEnabled('audioPreferenceDownload');
				if (isAutoDownloadEnabled || isCurrentUserAuthor) {
					await handleDownload();
					return;
				}
				setLoading(false);
				setCached(false);
			}
		} catch {
			// Do nothing
		}
	};

	useEffect(() => {
		const handleCache = async () => {
			const cachedAudioResult = await getMediaCache({
				type: 'audio',
				mimeType: file.audio_type,
				urlToCache: getUrl()
			});
			if (cachedAudioResult?.exists) {
				setFileUri(cachedAudioResult.uri);
				setLoading(false);
				setCached(true);
				return;
			}
			if (isReply) {
				setLoading(false);
				return;
			}
			await handleAutoDownload();
		};
		handleCache();
	}, []);

	if (!baseUrl) {
		return null;
	}
	return (
		<>
			<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} />
			<AudioPlayer
				fileUri={fileUri}
				isReadyToPlay={cached}
				loading={loading}
				disabled={isReply}
				onPlayButtonPressCallback={onPress}
			/>
		</>
	);
};

export default MessageAudio;
