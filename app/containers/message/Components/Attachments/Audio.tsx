import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';

import { emitter } from '../../../../lib/methods/helpers';
import { Encryption } from '../../../../lib/encryption';
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
	const isMounted = useRef(true);

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
		if (cachedAudioResult?.exists) {
			await decryptFileIfNeeded(cachedAudioResult.uri);
			setFileUri(cachedAudioResult.uri);
			setDownloadState('downloaded');
		}
		return !!cachedAudioResult?.exists;
	};

	const handleResumeDownload = () => {
		emitter.on(`downloadMedia${id}`, uri => {
			setFileUri(uri);
			setDownloadState('downloaded');
		});
	};

	const decryptFileIfNeeded = async (uri: string) => {
		if (!isMounted.current) {
			return;
		}
		if (file.encryption) {
			if (!file.hashes?.sha256) {
				return;
			}
			await Encryption.addFileToDecryptFileQueue(id, uri, file.encryption, file.hashes?.sha256);
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
			<AudioPlayer
				msgId={id}
				fileUri={fileUri}
				downloadState={downloadState}
				onPlayButtonPress={onPlayButtonPress}
				rid={rid}
				disabled={file.e2e === 'pending'}
			/>
		</>
	);
};

export default MessageAudio;
