import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import { IAttachment } from '../../../../definitions/IAttachment';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import I18n from '../../../../i18n';
import { themes } from '../../../../lib/constants';
import { fetchAutoDownloadEnabled } from '../../../../lib/methods/autoDownloadPreference';
import { cancelDownload, downloadMediaFile, getMediaCache, isDownloadActive } from '../../../../lib/methods/handleMediaDownload';
import { emitter, fileDownload, isIOS } from '../../../../lib/methods/helpers';
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
import { TIconsName } from '../../../CustomIcon';
import { useFile } from '../../hooks/useFile';
import { IUserMessage } from '../../../../definitions';

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
	author?: IUserMessage;
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
	if (encrypted && !loading && cached) {
		icon = 'encrypted';
	}

	return (
		<>
			<BlurComponent iconName={icon} loading={loading} style={styles.button} />
			{loading ? <CancelIndicator /> : null}
		</>
	);
};

const Video = ({
	file,
	showAttachment,
	getCustomEmoji,
	author,
	style,
	isReply,
	msg
}: IMessageVideo): React.ReactElement | null => {
	const { id, baseUrl, user } = useContext(MessageContext);
	const [videoCached, setVideoCached] = useFile(file, id);
	const [loading, setLoading] = useState(true);
	const [cached, setCached] = useState(false);
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
				setLoading(false);
			}
		};
		handleVideoSearchAndDownload();

		return () => {
			emitter.off(`downloadMedia${id}`, downloadMediaListener);
		};
	}, []);

	const downloadMediaListener = useCallback((uri: string) => {
		updateVideoCached(uri);
		setLoading(false);
	}, []);

	if (!baseUrl) {
		return null;
	}

	const handleAutoDownload = async () => {
		const isCurrentUserAuthor = author?._id === user.id;
		const isAutoDownloadEnabled = fetchAutoDownloadEnabled('videoPreferenceDownload');
		if ((isAutoDownloadEnabled || isCurrentUserAuthor) && file.video_type && isTypeSupported(file.video_type)) {
			await handleDownload();
			return;
		}
		setLoading(false);
	};

	const updateVideoCached = (videoUri: string) => {
		setVideoCached({ video_url: videoUri });
		setCached(true);
		setLoading(false);
	};

	const setDecrypted = () => {
		if (videoCached.e2e === 'pending') {
			setVideoCached({
				e2e: 'done'
			});
		}
	};

	const handleGetMediaCache = async () => {
		const cachedVideoResult = await getMediaCache({
			type: 'video',
			mimeType: file.video_type,
			urlToCache: video
		});
		const result = !!cachedVideoResult?.exists && videoCached.e2e !== 'pending';
		if (result) {
			updateVideoCached(cachedVideoResult.uri);
		}
		return result;
	};

	const handleResumeDownload = () => {
		emitter.on(`downloadMedia${id}`, downloadMediaListener);
	};

	const handleDownload = async () => {
		try {
			const videoUri = await downloadMediaFile({
				messageId: id,
				downloadUrl: video,
				type: 'video',
				mimeType: file.video_type,
				encryption: file.encryption,
				originalChecksum: file.hashes?.sha256
			});
			setDecrypted();
			updateVideoCached(videoUri);
		} catch {
			setCached(false);
		}
	};

	const onPress = async () => {
		if (file.video_type && cached && isTypeSupported(file.video_type) && showAttachment && videoCached.video_url) {
			showAttachment(videoCached);
			return;
		}
		if (!loading && !cached && file.video_type && isTypeSupported(file.video_type)) {
			const isVideoCached = await handleGetMediaCache();
			if (isVideoCached && showAttachment && videoCached.video_url) {
				showAttachment(videoCached);
				return;
			}
			if (isDownloadActive(video)) {
				handleResumeDownload();
				return;
			}
			setLoading(true);
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
				<Thumbnail loading={loading} cached={cached} encrypted={videoCached.e2e === 'pending'} />
			</Touchable>
		</>
	);
};

export default Video;
