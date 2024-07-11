import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';

import { emitter } from '../../../../lib/methods/helpers';
import Markdown from '../../../markdown';
import MessageContext from '../../Context';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../../../definitions';
import { TDownloadState, downloadMediaFile, getMediaCache, isDownloadActive } from '../../../../lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '../../../../lib/methods/autoDownloadPreference';
import AudioPlayer from '../../../AudioPlayer';
import { useAudioUrl } from '../../hooks/useAudioUrl';
import { getAudioUrlToCache } from '../../../../lib/methods/getAudioUrl';

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
				const audioUri = await downloadMediaFile({
					messageId: id,
					downloadUrl: getAudioUrlToCache({ token: user.token, userId: user.id, url: audioUrl }),
					type: 'audio',
					mimeType: file.audio_type,
					encryption: file.encryption,
					originalChecksum: file.hashes?.sha256
				});
				setFileUri(audioUri);
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
		const result = cachedAudioResult?.exists && file.e2e !== 'pending';
		if (result) {
			setFileUri(cachedAudioResult.uri);
			setDownloadState('downloaded');
		}
		return result;
	};

	const handleResumeDownload = () => {
		emitter.on(`downloadMedia${id}`, downloadMediaListener);
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

	const downloadMediaListener = useCallback((uri: string) => {
		setFileUri(uri);
		setDownloadState('downloaded');
	}, []);

	useEffect(() => () => {
		emitter.off(`downloadMedia${id}`, downloadMediaListener);
	});

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
