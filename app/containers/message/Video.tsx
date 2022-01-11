import React, { useContext, useState } from 'react';
import { StyleSheet } from 'react-native';
import { dequal } from 'dequal';

import Touchable from './Touchable';
import Markdown from '../markdown';
import { isIOS } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import MessageContext from './Context';
import { fileDownload } from '../../utils/fileDownload';
import EventEmitter from '../../utils/events';
import { LISTENER } from '../Toast';
import I18n from '../../i18n';
import { IAttachment } from '../../definitions/IAttachment';
import RCActivityIndicator from '../ActivityIndicator';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = (type: any) => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	button: {
		flex: 1,
		borderRadius: 4,
		height: 150,
		marginBottom: 6,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

interface IMessageVideo {
	file: IAttachment;
	showAttachment: Function;
	getCustomEmoji: Function;
	theme: string;
}

const Video = React.memo(
	({ file, showAttachment, getCustomEmoji, theme }: IMessageVideo) => {
		const { baseUrl, user } = useContext(MessageContext);
		const [loading, setLoading] = useState(false);

		if (!baseUrl) {
			return null;
		}
		const onPress = async () => {
			if (isTypeSupported(file.video_type)) {
				return showAttachment(file);
			}

			if (!isIOS) {
				const uri = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);
				await downloadVideo(uri);
				return;
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('Unsupported_format') });
		};

		const downloadVideo = async (uri: string) => {
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
				<Touchable
					onPress={onPress}
					style={[styles.button, { backgroundColor: themes[theme].videoBackground }]}
					background={Touchable.Ripple(themes[theme].bannerBackground)}>
					{loading ? (
						<RCActivityIndicator theme={theme} />
					) : (
						<CustomIcon name='play-filled' size={54} color={themes[theme].buttonText} />
					)}
				</Touchable>
				{/* @ts-ignore*/}
				<Markdown
					msg={file.description}
					baseUrl={baseUrl}
					username={user.username}
					getCustomEmoji={getCustomEmoji}
					theme={theme}
				/>
			</>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file) && prevProps.theme === nextProps.theme
);

export default Video;
