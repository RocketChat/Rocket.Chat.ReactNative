import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { type IUseRoomMessageHandlersResult } from '~/definitions/IRoomMessageHandlers';
import { type IUserMessage } from '~/definitions/IMessage';
import { type IAttachment } from '~/definitions/IAttachment';
import I18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers/deviceInfo';
import { fileDownload } from '~/lib/methods/helpers/fileDownload';
import EventEmitter from '~/lib/methods/helpers/events';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { type TIconsName } from '~/containers/CustomIcon';
import { LISTENER } from '~/containers/Toast';
import Markdown from '~/containers/markdown';
import MessageActionTouchable from '../Touchable/MessageActionTouchable';
import { useMediaAutoDownload } from '~/containers/message/hooks/useMediaAutoDownload';
import { useMessageUser } from '~/containers/message/stores/MessageRoomStore';
import BlurComponent from '../OverlayComponent';
import { type TDownloadState } from '~/lib/methods/handleMediaDownload';
import messageStyles from '~/containers/message/styles';
import { mediaSharedTransition } from '~/lib/animations/mediaSharedTransition';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = (type: string) => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	cancelContainer: {
		position: 'absolute',
		top: 8,
		right: 8
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 12
	},
	thumbnailFrame: {
		...messageStyles.image,
		overflow: 'visible'
	},
	thumbnailBackdrop: {
		borderRadius: messageStyles.image.borderRadius
	}
});

interface IMessageVideo {
	file: IAttachment;
	showAttachment?: IUseRoomMessageHandlersResult['showAttachment'];
	author?: IUserMessage;
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

const Thumbnail = ({
	status,
	encrypted = false,
	sharedTransitionTag
}: {
	status: TDownloadState;
	encrypted: boolean;
	sharedTransitionTag: string;
}) => {
	const { colors } = useTheme();
	let icon: TIconsName = status === 'downloaded' ? 'play-filled' : 'arrow-down-circle';
	if (encrypted && status === 'downloaded') {
		icon = 'encrypted';
	}

	return (
		<>
			<Animated.View
				style={[StyleSheet.absoluteFill, styles.thumbnailBackdrop, { backgroundColor: colors.surfaceNeutral }]}
				sharedTransitionTag={sharedTransitionTag}
				sharedTransitionStyle={mediaSharedTransition}
			/>
			<BlurComponent
				iconName={icon}
				loading={status === 'loading'}
				style={[messageStyles.image, { borderColor: colors.strokeLight, borderWidth: 1 }]}
			/>
			{status === 'loading' ? <CancelIndicator /> : null}
		</>
	);
};

const Video = ({ file, showAttachment, author, msg }: IMessageVideo): ReactElement | null => {
	const user = useMessageUser();
	const { status, onPress, url, isEncrypted, currentFile, sharedTransitionTag } = useMediaAutoDownload({
		file,
		author,
		showAttachment
	});

	const _onPress = async () => {
		if (currentFile.video_type && !isTypeSupported(currentFile.video_type)) {
			if (isIOS) {
				EventEmitter.emit(LISTENER, { message: I18n.t('Unsupported_format') });
			} else {
				await downloadVideoToGallery(url);
			}
			return;
		}
		onPress();
	};

	const downloadVideoToGallery = async (uri: string) => {
		try {
			const fileDownloaded = await fileDownload(uri, file);
			if (fileDownloaded) {
				EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
			}
		} catch (error) {
			EventEmitter.emit(LISTENER, { message: I18n.t('error-save-video') });
		}
	};

	return (
		<View style={{ gap: 4 }}>
			{msg ? <Markdown msg={msg} username={user?.username} /> : null}
			<MessageActionTouchable onPress={_onPress} style={styles.thumbnailFrame}>
				<Thumbnail status={status} encrypted={isEncrypted} sharedTransitionTag={sharedTransitionTag} />
			</MessageActionTouchable>
		</View>
	);
};

export default Video;
