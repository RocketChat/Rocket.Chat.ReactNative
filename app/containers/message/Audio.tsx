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
	const [downloadState, setDownloadState] = useState<TDownloadState>('loading');
	const [fileUri, setFileUri] = useState('');
	const { baseUrl, user, id, rid } = useContext(MessageContext);
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
			const url = getUrl();
			if (url) {
				const audio = await downloadMediaFile({
					downloadUrl: `${url}?rc_uid=${user.id}&rc_token=${user.token}`,
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
		const url = getUrl();
		try {
			if (url) {
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
			urlToCache: getUrl()
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
			const url = getUrl();
			if (url) {
				const videoUri = await resumeMediaFile({
					downloadUrl: url
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
			const audioUrl = getUrl();
			if (audioUrl && isDownloadActive(audioUrl)) {
				handleResumeDownload();
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
			<AudioPlayer msgId={id} fileUri={fileUri} downloadState={downloadState} onPlayButtonPress={onPlayButtonPress} rid={rid} />
		</>
	);
};

export default MessageAudio;
