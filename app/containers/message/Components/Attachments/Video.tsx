import React, { useContext } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import { IUserMessage } from '../../../../definitions';
import { IAttachment } from '../../../../definitions/IAttachment';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import I18n from '../../../../i18n';
import { themes } from '../../../../lib/constants';
import { fileDownload, isIOS } from '../../../../lib/methods/helpers';
import EventEmitter from '../../../../lib/methods/helpers/events';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { TIconsName } from '../../../CustomIcon';
import { LISTENER } from '../../../Toast';
import Markdown from '../../../markdown';
import MessageContext from '../../Context';
import Touchable from '../../Touchable';
import { useMediaAutoDownload } from '../../hooks/useMediaAutoDownload';
import { DEFAULT_MESSAGE_HEIGHT } from '../../utils';
import BlurComponent from '../OverlayComponent';
import { TDownloadState } from '../../../../lib/methods/handleMediaDownload';

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

const Thumbnail = ({ status, encrypted = false }: { status: TDownloadState; encrypted: boolean }) => {
	let icon: TIconsName = status === 'downloaded' ? 'play-filled' : 'arrow-down-circle';
	if (encrypted && status === 'downloaded') {
		icon = 'encrypted';
	}

	return (
		<>
			<BlurComponent iconName={icon} loading={status === 'loading'} style={styles.button} />
			{status === 'loading' ? <CancelIndicator /> : null}
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
	const { user } = useContext(MessageContext);
	const { theme } = useTheme();
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
		<>
			<Markdown msg={msg} username={user.username} getCustomEmoji={getCustomEmoji} style={[isReply && style]} theme={theme} />
			<Touchable
				onPress={_onPress}
				style={[styles.button, { backgroundColor: themes[theme].surfaceDark }]}
				background={Touchable.Ripple(themes[theme].surfaceNeutral)}>
				<Thumbnail status={status} encrypted={isEncrypted} />
			</Touchable>
		</>
	);
};

export default Video;
