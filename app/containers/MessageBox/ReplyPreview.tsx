import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import moment from 'moment';
import { connect, useSelector } from 'react-redux';

import Markdown from '../markdown';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { formatAttachmentUrl } from '../../lib/utils';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingTop: 10
	},
	messageContainer: {
		flex: 1,
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderBottomLeftRadius: 4,
		borderTopLeftRadius: 4
	},
	isPreview: {
		marginLeft: 10
	},
	isMessage: {
		marginBottom: 2
	},
	thumbnail: {
		flex: 0.25,
		width: 55,
		marginRight: 10,
		borderBottomRightRadius: 4,
		borderTopRightRadius: 4
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 12,
		lineHeight: 16,
		marginLeft: 6,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	close: {
		marginRight: 10
	}
});

interface IMessageBoxReplyPreview {
	replying: boolean;
	message: {
		ts: Date;
		msg: string;
		text?: string;
		attachments: [
			{
				title_link?: string;
				description: string;
				image_url?: string;
				video_url?: string;
				audio_url?: string;
			}
		];
		author_name?: string;
		u: any;
	};
	Message_TimeFormat: string;
	close(): void;
	baseUrl: string;
	username: string;
	getCustomEmoji: Function;
	theme: string;
	useRealName: boolean;
}

const ReplyPreview = React.memo(
	({
		message,
		Message_TimeFormat,
		baseUrl,
		username,
		replying,
		getCustomEmoji,
		close,
		theme,
		useRealName
	}: IMessageBoxReplyPreview) => {
		if (!replying) {
			return null;
		}

		const messageUser = useRealName ? message.u?.name : message.u?.username || message.author_name;
		let description;
		if (!message.msg) {
			if (!message.attachments[0]?.description && message.attachments[0]?.image_url) {
				description = 'Image';
			} else if (!message.attachments[0]?.description && message.attachments[0]?.video_url) {
				description = 'Video';
			} else if (!message.attachments[0]?.description && message.attachments[0]?.audio_url) {
				description = 'Audio';
			} else {
				description = message.msg || message.text || message.attachments[0]?.description || 'File';
			}
		} else {
			description = message.msg;
		}
		console.log({ message });
		const user = useSelector((state: any) => state.login?.user);
		const uri = message.attachments[0]?.image_url
			? formatAttachmentUrl(message.attachments[0]?.image_url, user.id, user.token, baseUrl)
			: null;
		const time = moment(message.ts).format(Message_TimeFormat);
		return (
			<View
				style={[
					styles.container,
					!message.author_name ? styles.isPreview : styles.isMessage,
					{ backgroundColor: themes[theme].messageboxBackground }
				]}>
				<View style={[styles.messageContainer, { backgroundColor: themes[theme].chatComponentBackground }]}>
					<View style={styles.header}>
						<Text style={[styles.username, { color: themes[theme].tintColor }]}>{messageUser}</Text>
						<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
					</View>
					{/* @ts-ignore*/}
					<Markdown
						msg={description}
						baseUrl={baseUrl}
						username={username}
						getCustomEmoji={getCustomEmoji}
						numberOfLines={1}
						preview
						theme={theme}
					/>
				</View>
				{uri ? <Image style={styles.thumbnail} source={{ uri }} /> : null}
				{close ? (
					<CustomIcon name='close' color={themes[theme].auxiliaryText} size={20} style={styles.close} onPress={close} />
				) : null}
			</View>
		);
	},
	(prevProps: any, nextProps: any) =>
		prevProps.replying === nextProps.replying &&
		prevProps.theme === nextProps.theme &&
		prevProps.message.id === nextProps.message.id
);

const mapStateToProps = (state: any) => ({
	Message_TimeFormat: state.settings.Message_TimeFormat,
	baseUrl: state.server.server,
	useRealName: state.settings.UI_Use_Real_Name
});

export default connect(mapStateToProps)(ReplyPreview);
