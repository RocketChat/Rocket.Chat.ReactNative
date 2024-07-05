import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import { IAttachment } from '../../../../definitions/IAttachment';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import I18n from '../../../../i18n';
import { themes } from '../../../../lib/constants';
import { fetchAutoDownloadEnabled } from '../../../../lib/methods/autoDownloadPreference';
import { cancelDownload, downloadMediaFile, getMediaCache, isDownloadActive } from '../../../../lib/methods/handleMediaDownload';
import { emitter, fileDownload, isIOS, showErrorAlert } from '../../../../lib/methods/helpers';
import EventEmitter from '../../../../lib/methods/helpers/events';
import { formatAttachmentUrl } from '../../../../lib/methods/helpers/formatAttachmentUrl';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { LISTENER } from '../../../Toast';
import Markdown from '../../../markdown';
import BlurComponent from '../OverlayComponent';
import MessageContext from '../../Context';
import Touchable from '../../Touchable';
import { DEFAULT_MESSAGE_HEIGHT } from '../../utils';
import { Encryption } from '../../../../lib/encryption';
import { TIconsName } from '../../../CustomIcon';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = (type: string) => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	button: {
		flex: 1,
		borderRadius: 4,
		height: DEFAULT_MESSAGE_HEIGHT,
		marginBottom: 6,
		alignItems: 'center',
		justifyContent: 'center'
	},
	cancelContainer: {
		position: 'absolute',
		top: 8,
		right: 8
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 12
	}
});

interface IMessageVideo {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	msg?: string;
}

const CancelIndicator = () => {
	const { colors } = useTheme();
	return (
		<View style={styles.cancelContainer}>
			<Text style={[styles.text, { color: colors.fontSecondaryInfo }]}>{I18n.t('Cancel')}</Text>
		</View>
	);
};

const Thumbnail = ({ loading, cached, encrypted = false }: { loading: boolean; cached: boolean; encrypted: boolean }) => {
	let icon: TIconsName = cached ? 'play-filled' : 'arrow-down-circle';
	if (encrypted) {
		icon = 'encrypted';
	}

	return (
		<>
			<BlurComponent iconName={icon} loading={loading} style={styles.button} />
			{loading ? <CancelIndicator /> : null}
		</>
	);
};

const Video = ({ file, showAttachment, getCustomEmoji, style, isReply, msg }: IMessageVideo): React.ReactElement | null => {
	const [videoCached, setVideoCached] = useState(file);
	const [loading, setLoading] = useState(true);
	const [cached, setCached] = useState(false);
	const { id, baseUrl, user } = useContext(MessageContext);
	const { theme } = useTheme();
	const video = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);

	useEffect(() => {
		const handleVideoSearchAndDownload = async () => {
			if (video) {
				const isVideoCached = await handleGetMediaCache();
				if (isVideoCached) {
					return;
				}
				if (isDownloadActive(video)) {
					handleResumeDownload();
					return;
				}
				await handleAutoDownload();
			}
		};
		handleVideoSearchAndDownload();
	}, []);

	if (!baseUrl) {
		return null;
	}

	const handleAutoDownload = async () => {
		const isAutoDownloadEnabled = fetchAutoDownloadEnabled('videoPreferenceDownload');
		if (isAutoDownloadEnabled && file.video_type && isTypeSupported(file.video_type)) {
			await handleDownload();
			return;
		}
		setLoading(false);
	};

	const updateVideoCached = (videoUri: string) => {
		setVideoCached(prev => ({
			...prev,
			video_url: videoUri
		}));
		setCached(true);
	};

	const handleGetMediaCache = async () => {
		const cachedVideoResult = await getMediaCache({
			type: 'video',
			mimeType: file.video_type,
			urlToCache: video
		});
		if (cachedVideoResult?.exists) {
			await decryptFileIfNeeded(cachedVideoResult.uri);
			updateVideoCached(cachedVideoResult.uri);
			setLoading(false);
		}
		return !!cachedVideoResult?.exists;
	};

	const handleResumeDownload = () => {
		emitter.on(`downloadMedia${id}`, uri => {
			updateVideoCached(uri);
			setLoading(false);
		});
	};

	const handleDownload = async () => {
		setLoading(true);
		try {
			const videoUri = await downloadMediaFile({
				messageId: id,
				downloadUrl: video,
				type: 'video',
				mimeType: file.video_type,
				encryption: file.encryption,
				originalChecksum: file.hashes?.sha256
			});
			updateVideoCached(videoUri);
		} catch {
			setCached(false);
		} finally {
			setLoading(false);
		}
	};

	const decryptFileIfNeeded = async (uri: string) => {
		if (file.encryption) {
			if (!file.hashes?.sha256) {
				return;
			}
			await Encryption.addFileToDecryptFileQueue(id, uri, file.encryption, file.hashes?.sha256);
		}
	};

	const onPress = async () => {
		if (file.e2e === 'pending') {
			showErrorAlert(I18n.t('Encrypted_file'));
			return;
		}
		if (file.video_type && cached && isTypeSupported(file.video_type) && showAttachment) {
			showAttachment(videoCached);
			return;
		}
		if (!loading && !cached && file.video_type && isTypeSupported(file.video_type)) {
			const isVideoCached = await handleGetMediaCache();
			if (isVideoCached && showAttachment) {
				showAttachment(videoCached);
				return;
			}
			if (isDownloadActive(video)) {
				handleResumeDownload();
				return;
			}
			handleDownload();
			return;
		}
		if (loading && !cached) {
			handleCancelDownload();
			return;
		}
		if (!isIOS && file.video_url) {
			await downloadVideoToGallery(video);
			return;
		}
		EventEmitter.emit(LISTENER, { message: I18n.t('Unsupported_format') });
	};

	const handleCancelDownload = () => {
		if (loading) {
			cancelDownload(video);
			setLoading(false);
		}
	};

	const downloadVideoToGallery = async (uri: string) => {
		setLoading(true);
		const fileDownloaded = await fileDownload(uri, file);
		setLoading(false);

		if (fileDownloaded) {
			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
			return;
		}
		EventEmitter.emit(LISTENER, { message: I18n.t('error-save-video') });
	};

	return (
		<>
			<Markdown msg={msg} username={user.username} getCustomEmoji={getCustomEmoji} style={[isReply && style]} theme={theme} />
			<Touchable
				onPress={onPress}
				style={[styles.button, { backgroundColor: themes[theme].surfaceDark }]}
				background={Touchable.Ripple(themes[theme].surfaceNeutral)}>
				<Thumbnail loading={loading} cached={cached} encrypted={file.e2e === 'pending'} />
			</Touchable>
		</>
	);
};

export default Video;
