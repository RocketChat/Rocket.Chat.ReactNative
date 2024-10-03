import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { IUserMessage } from '../../../../definitions';
import { IAttachment } from '../../../../definitions/IAttachment';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import I18n from '../../../../i18n';
import { fileDownload, isIOS } from '../../../../lib/methods/helpers';
import EventEmitter from '../../../../lib/methods/helpers/events';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { LISTENER } from '../../../Toast';
import Markdown from '../../../markdown';
import MessageContext from '../../Context';
import Touchable from '../../Touchable';
import { useMediaAutoDownload } from '../../hooks/useMediaAutoDownload';
import messageStyles from '../../styles';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import OverlayComponent from '../OverlayComponent';
import FastImage from 'react-native-fast-image';
import { CustomIcon } from '../../../CustomIcon';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = (type: string) => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	overlay: {
		flex: 1
	},
	image: {
		width: '100%',
		height: '100%'
	},
	playerIcon: {
		position: 'absolute',
		shadowColor: '#000',
		shadowOpacity: 0.3,
		shadowOffset: {
			width: 1,
			height: 1
		}
	}
});

type Image = {
	loading: boolean;
	uri: string | null;
};

type ThumbnailProps = {
	url: string;
	encrypted?: boolean;
};

const Thumbnail = ({ url, encrypted = false }: ThumbnailProps) => {
	const icon = encrypted ? 'encrypted' : 'play-filled';

	const [image, setImage] = useState<Image>({
		loading: true,
		uri: null
	});

	const generateThumbnail = async () => {
		try {
			if (!url) return;

			const { uri } = await getThumbnailAsync(url, {
				time: 1
			});
			setImage({
				loading: false,
				uri
			});
		} catch (e) {
			console.warn(e);
		}
	};

	useEffect(() => {
		generateThumbnail();
	}, [url]);

	return (
		<View style={styles.container}>
			{image.loading || !image.uri ? (
				<OverlayComponent style={styles.overlay} loading={image.loading} iconName='arrow-down-circle' />
			) : (
				<>
					<FastImage style={styles.image} source={{ uri: image.uri }} />
					<CustomIcon name={icon} size={54} color='#fff' style={styles.playerIcon} />
				</>
			)}
		</View>
	);
};

interface IMessageVideo {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
	author?: IUserMessage;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	msg?: string;
}

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
	const { theme, colors } = useTheme();
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
			<Touchable onPress={_onPress} style={messageStyles.image} background={Touchable.Ripple(colors.surfaceNeutral)}>
				<Thumbnail url={url} encrypted={isEncrypted} />
			</Touchable>
		</>
	);
};

export default Video;
