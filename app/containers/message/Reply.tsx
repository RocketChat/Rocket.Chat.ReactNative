import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import moment from 'moment';
import { dequal } from 'dequal';
import FastImage from 'react-native-fast-image';

import Touchable from './Touchable';
import Markdown from '../markdown';
import openLink from '../../lib/methods/helpers/openLink';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import { fileDownloadAndPreview } from './helpers/fileDownload';
import { IAttachment, TGetCustomEmoji } from '../../definitions';
import RCActivityIndicator from '../ActivityIndicator';
import Attachments from './Attachments';
import { TSupportedThemes, useTheme } from '../../theme';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import messageStyles from './styles';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 4,
		alignSelf: 'flex-start',
		borderLeftWidth: 2
	},
	attachmentContainer: {
		flex: 1,
		borderRadius: 4,
		flexDirection: 'column',
		paddingVertical: 4,
		paddingLeft: 8
	},
	backdrop: {
		...StyleSheet.absoluteFillObject
	},
	authorContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8
	},
	author: {
		fontSize: 16,
		...sharedStyles.textMedium,
		flexShrink: 1
	},
	fieldsContainer: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	},
	fieldContainer: {
		flexDirection: 'column',
		padding: 10
	},
	fieldTitle: {
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	fieldValue: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	marginTop: {
		marginTop: 4
	},
	marginBottom: {
		marginBottom: 4
	},
	image: {
		height: 200,
		flex: 1,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4,
		marginBottom: 1
	},
	title: {
		flex: 1,
		fontSize: 16,
		marginBottom: 3,
		...sharedStyles.textMedium
	}
});

interface IMessageReply {
	attachment: IAttachment;
	timeFormat?: string;
	index: number;
	getCustomEmoji: TGetCustomEmoji;
	messageId: string;
}

const Title = React.memo(
	({ attachment, timeFormat, theme }: { attachment: IAttachment; timeFormat?: string; theme: TSupportedThemes }) => {
		const time = attachment.message_link && attachment.ts ? moment(attachment.ts).format(timeFormat) : null;
		return (
			<View style={styles.authorContainer}>
				{attachment.author_name ? (
					<Text numberOfLines={1} style={[styles.author, { color: themes[theme].auxiliaryTintColor }]}>
						{attachment.author_name}
					</Text>
				) : null}
				{time ? <Text style={[messageStyles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text> : null}
				{attachment.title ? <Text style={[styles.title, { color: themes[theme].bodyText }]}>{attachment.title}</Text> : null}
			</View>
		);
	}
);

const Description = React.memo(
	({
		attachment,
		getCustomEmoji,
		theme
	}: {
		attachment: IAttachment;
		getCustomEmoji: TGetCustomEmoji;
		theme: TSupportedThemes;
	}) => {
		const { user } = useContext(MessageContext);
		const text = attachment.text || attachment.title;

		if (!text) {
			return null;
		}

		return (
			<Markdown
				msg={text}
				style={[{ color: themes[theme].auxiliaryTintColor, fontSize: 14 }]}
				username={user.username}
				getCustomEmoji={getCustomEmoji}
				theme={theme}
			/>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.attachment.text !== nextProps.attachment.text) {
			return false;
		}
		if (prevProps.attachment.title !== nextProps.attachment.title) {
			return false;
		}
		if (prevProps.theme !== nextProps.theme) {
			return false;
		}
		return true;
	}
);

const UrlImage = React.memo(
	({ image }: { image?: string }) => {
		const { baseUrl, user } = useContext(MessageContext);

		if (!image) {
			return null;
		}

		image = image.includes('http') ? image : `${baseUrl}/${image}?rc_uid=${user.id}&rc_token=${user.token}`;
		return <FastImage source={{ uri: image }} style={styles.image} resizeMode={FastImage.resizeMode.cover} />;
	},
	(prevProps, nextProps) => prevProps.image === nextProps.image
);

const Fields = React.memo(
	({
		attachment,
		theme,
		getCustomEmoji
	}: {
		attachment: IAttachment;
		theme: TSupportedThemes;
		getCustomEmoji: TGetCustomEmoji;
	}) => {
		const { user } = useContext(MessageContext);

		if (!attachment.fields) {
			return null;
		}

		return (
			<View style={styles.fieldsContainer}>
				{attachment.fields.map(field => (
					<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
						<Text style={[styles.fieldTitle, { color: themes[theme].bodyText }]}>{field.title}</Text>
						<Markdown msg={field?.value || ''} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
					</View>
				))}
			</View>
		);
	},
	(prevProps, nextProps) =>
		dequal(prevProps.attachment.fields, nextProps.attachment.fields) && prevProps.theme === nextProps.theme
);

const Reply = React.memo(
	({ attachment, timeFormat, index, getCustomEmoji, messageId }: IMessageReply) => {
		const [loading, setLoading] = useState(false);
		const { theme } = useTheme();
		const { baseUrl, user, jumpToMessage } = useContext(MessageContext);

		if (!attachment) {
			return null;
		}

		const onPress = async () => {
			let url = attachment.title_link || attachment.author_link;
			if (attachment.message_link) {
				return jumpToMessage(attachment.message_link);
			}
			if (!url) {
				return;
			}
			if (attachment.type === 'file' && attachment.title_link) {
				setLoading(true);
				url = formatAttachmentUrl(attachment.title_link, user.id, user.token, baseUrl);
				await fileDownloadAndPreview(url, attachment);
				setLoading(false);
				return;
			}
			openLink(url, theme);
		};

		let { borderColor } = themes[theme];
		if (attachment.color) {
			borderColor = attachment.color;
		}

		return (
			<>
				<Touchable
					onPress={onPress}
					style={[
						styles.button,
						index > 0 && styles.marginTop,
						attachment.description && styles.marginBottom,
						{
							borderColor
						}
					]}
					background={Touchable.Ripple(themes[theme].bannerBackground)}
					disabled={loading}
				>
					<View style={styles.attachmentContainer}>
						<Title attachment={attachment} timeFormat={timeFormat} theme={theme} />
						<Attachments
							attachments={attachment.attachments}
							getCustomEmoji={getCustomEmoji}
							timeFormat={timeFormat}
							style={[{ color: themes[theme].auxiliaryTintColor, fontSize: 14, marginBottom: 8 }]}
							isReply
							id={messageId}
						/>
						<UrlImage image={attachment.thumb_url} />
						<Description attachment={attachment} getCustomEmoji={getCustomEmoji} theme={theme} />
						<Fields attachment={attachment} getCustomEmoji={getCustomEmoji} theme={theme} />
						{loading ? (
							<View style={[styles.backdrop]}>
								<View
									style={[
										styles.backdrop,
										{ backgroundColor: themes[theme].bannerBackground, opacity: themes[theme].attachmentLoadingOpacity }
									]}
								></View>
								<RCActivityIndicator />
							</View>
						) : null}
					</View>
				</Touchable>
				<Markdown msg={attachment.description} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
			</>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.attachment, nextProps.attachment)
);

Reply.displayName = 'MessageReply';
Title.displayName = 'MessageReplyTitle';
Description.displayName = 'MessageReplyDescription';
Fields.displayName = 'MessageReplyFields';

export default Reply;
