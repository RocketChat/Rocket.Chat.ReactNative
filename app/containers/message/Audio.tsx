import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';

import Markdown from '../markdown';
import MessageContext from './Context';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../definitions';
import {
	TDownloadState,
	downloadMediaFile,
	getMediaCache,
	isDownloadActive,
	resumeMediaFile
} from '../../lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '../../lib/methods/autoDownloadPreference';
import AudioPlayer from '../AudioPlayer';
import { useAudioUrl } from './hooks/useAudioUrl';
import { getAudioUrlToCache } from '../../lib/methods/getAudioUrl';

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
	const [downloadState, setDownloadState] = useState<TDownloadState>('loading');
	const [fileUri, setFileUri] = useState('');
	const { baseUrl, user, id, rid } = useContext(MessageContext);

	const audioUrl = useAudioUrl({ audioUrl: file.audio_url });

	const onPlayButtonPress = async () => {
		if (downloadState === 'to-download') {
			const isAudioCached = await handleGetMediaCache();
			if (isAudioCached) {
				return;
			}
			handleDownload();
		}
	};

	const handleDownload = async () => {
		setDownloadState('loading');
		try {
			if (audioUrl) {
				const audio = await downloadMediaFile({
					downloadUrl: getAudioUrlToCache({ token: user.token, userId: user.id, url: audioUrl }),
					type: 'audio',
					mimeType: file.audio_type
				});
				setFileUri(audio);
				setDownloadState('downloaded');
			}
		} catch {
			setDownloadState('to-download');
		}
	};

	const handleAutoDownload = async () => {
		try {
			if (audioUrl) {
				const isCurrentUserAuthor = author?._id === user.id;
				const isAutoDownloadEnabled = fetchAutoDownloadEnabled('audioPreferenceDownload');
				if (isAutoDownloadEnabled || isCurrentUserAuthor) {
					await handleDownload();
					return;
				}
				setDownloadState('to-download');
			}
		} catch {
			// Do nothing
		}
	};

	const handleGetMediaCache = async () => {
		const cachedAudioResult = await getMediaCache({
			type: 'audio',
			mimeType: file.audio_type,
			urlToCache: audioUrl
		});
		if (cachedAudioResult?.exists) {
			setFileUri(cachedAudioResult.uri);
			setDownloadState('downloaded');
		}
		return !!cachedAudioResult?.exists;
	};

	const handleResumeDownload = async () => {
		try {
			setDownloadState('loading');
			if (audioUrl) {
				const videoUri = await resumeMediaFile({
					downloadUrl: audioUrl
				});
				setFileUri(videoUri);
				setDownloadState('downloaded');
			}
		} catch (e) {
			setDownloadState('to-download');
		}
	};

	useEffect(() => {
		const handleCache = async () => {
			const isAudioCached = await handleGetMediaCache();
			if (isAudioCached) {
				return;
			}
			if (audioUrl && isDownloadActive(audioUrl)) {
				handleResumeDownload();
				return;
			}
			await handleAutoDownload();
		};
		if (audioUrl) {
			handleCache();
		}
	}, [audioUrl]);

	if (!baseUrl) {
		return null;
	}

	return (
		<>
			<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} />
			<AudioPlayer msgId={id} fileUri={fileUri} downloadState={downloadState} onPlayButtonPress={onPlayButtonPress} rid={rid} />
		</>
	);
};

export default MessageAudio;
