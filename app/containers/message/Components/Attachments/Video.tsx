import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type IUserMessage } from '../../../../definitions';
import { type IAttachment } from '../../../../definitions/IAttachment';
import { type TGetCustomEmoji } from '../../../../definitions/IEmoji';
import I18n from '../../../../i18n';
import { fileDownload, isIOS } from '../../../../lib/methods/helpers';
import EventEmitter from '../../../../lib/methods/helpers/events';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { type TIconsName } from '../../../CustomIcon';
import { LISTENER } from '../../../Toast';
import Markdown from '../../../markdown';
import MessageContext from '../../Context';
import Touchable from '../../Touchable';
import { useMediaAutoDownload } from '../../hooks/useMediaAutoDownload';
import BlurComponent from '../OverlayComponent';
import { type TDownloadState } from '../../../../lib/methods/handleMediaDownload';
import messageStyles from '../../styles';

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
	}
});

interface IMessageVideo {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
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

const Thumbnail = ({ status, encrypted = false }: { status: TDownloadState; encrypted: boolean }) => {
	const { colors } = useTheme();
	let icon: TIconsName = status === 'downloaded' ? 'play-filled' : 'arrow-down-circle';
	if (encrypted && status === 'downloaded') {
		icon = 'encrypted';
	}

	return (
		<>
			<BlurComponent
				iconName={icon}
				loading={status === 'loading'}
				style={[messageStyles.image, { borderColor: colors.strokeLight, borderWidth: 1 }]}
			/>
			{status === 'loading' ? <CancelIndicator /> : null}
		</>
	);
};

const Video = ({ file, showAttachment, getCustomEmoji, author, msg }: IMessageVideo): React.ReactElement | null => {
	'use memo';

	const { user } = useContext(MessageContext);
	const { colors } = useTheme();
	const { status, onPress, url, isEncrypted, currentFile } = useMediaAutoDownload({ file, author, showAttachment });

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
			{msg ? <Markdown msg={msg} username={user.username} getCustomEmoji={getCustomEmoji} /> : null}
			<Touchable onPress={_onPress} style={messageStyles.image} background={Touchable.Ripple(colors.surfaceNeutral)}>
				<Thumbnail status={status} encrypted={isEncrypted} />
			</Touchable>
		</View>
	);
};

export default Video;
