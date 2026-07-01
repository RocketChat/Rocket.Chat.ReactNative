import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { type IAttachment, type TGetCustomEmoji } from '../../../../definitions';
import { themes } from '../../../../lib/constants/colors';
import { fileDownloadAndPreview } from '../../../../lib/methods/helpers';
import { formatAttachmentUrl } from '../../../../lib/methods/helpers/formatAttachmentUrl';
import openLink from '../../../../lib/methods/helpers/openLink';
import { type TSupportedThemes, useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import RCActivityIndicator from '../../../ActivityIndicator';
import Markdown, { MarkdownPreview } from '../../../markdown';
import { Attachments } from './components';
import Quote from './Quote';
import { useBaseUrl, useMessageUser } from '../../MessageRoomStore';
import { useIsEncrypted, useMessageId } from '../../MessageStore';
import Touchable from '../../Touchable';
import messageStyles from '../../styles';
import dayjs from '../../../../lib/dayjs';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		borderLeftWidth: 2
	},
	attachmentContainer: {
		flex: 1,
		borderRadius: 4,
		flexDirection: 'row',
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
		gap: 4
	},
	titleAndDescriptionContainer: {
		flexDirection: 'column',
		flex: 1,
		width: 200,
		gap: 4
	},
	author: {
		fontSize: 16,
		...sharedStyles.textMedium,
		flexShrink: 1
	},
	fieldsContainer: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row',
		rowGap: 12
	},
	fieldContainer: {
		flexDirection: 'column'
	},
	fieldTitle: {
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	image: {
		height: 80,
		width: 80,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4,
		marginBottom: 1,
		marginLeft: 20
	},
	title: {
		flex: 1,
		fontSize: 16,
		...sharedStyles.textMedium
	}
});

interface IMessageReply {
	attachment: IAttachment;
	timeFormat?: string;
	getCustomEmoji: TGetCustomEmoji;
	msg?: string;
}

const Title = ({ attachment, timeFormat, theme }: { attachment: IAttachment; timeFormat?: string; theme: TSupportedThemes }) => {
	'use memo';

	const time = attachment.message_link && attachment.ts ? dayjs(attachment.ts).format(timeFormat) : null;
	return (
		<View style={styles.authorContainer}>
			{attachment.author_name ? (
				<Text numberOfLines={1} style={[styles.author, { color: themes[theme].fontHint }]}>
					{attachment.author_name}
				</Text>
			) : null}
			{time ? <Text style={[messageStyles.time, { color: themes[theme].fontSecondaryInfo }]}>{time}</Text> : null}
			{attachment.title ? <Text style={[styles.title, { color: themes[theme].fontDefault }]}>{attachment.title}</Text> : null}
		</View>
	);
};

const Description = ({ attachment, getCustomEmoji }: { attachment: IAttachment; getCustomEmoji: TGetCustomEmoji }) => {
	'use memo';

	const user = useMessageUser();
	const text = attachment.text || attachment.title;

	if (!text) {
		return null;
	}

	// For file attachments without explicit text, the title is just a filename (e.g., "test.py").
	// We use MarkdownPreview to avoid markdown parsing treating filenames as URLs or markdown syntax.
	// For other attachments (message quotes, embeds), the text may contain actual markdown formatting,
	// so we use the full Markdown component to preserve styling.
	const isFileName = attachment.type === 'file' && !attachment.text;

	if (isFileName) {
		return <MarkdownPreview msg={text} numberOfLines={0} />;
	}

	return <Markdown msg={text} username={user?.username} getCustomEmoji={getCustomEmoji} />;
};

const UrlImage = ({ image }: { image?: string }) => {
	'use memo';

	const baseUrl = useBaseUrl();
	const user = useMessageUser();

	if (!image) {
		return null;
	}

	image = image.includes('http') ? image : `${baseUrl}/${image}?rc_uid=${user?.id ?? ''}&rc_token=${user?.token ?? ''}`;
	return <Image source={{ uri: image }} style={styles.image} contentFit='cover' />;
};

const Fields = ({
	attachment,
	theme,
	getCustomEmoji
}: {
	attachment: IAttachment;
	theme: TSupportedThemes;
	getCustomEmoji: TGetCustomEmoji;
}) => {
	'use memo';

	const user = useMessageUser();

	if (!attachment.fields) {
		return null;
	}

	return (
		<View style={styles.fieldsContainer}>
			{attachment.fields.map(field => (
				<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
					<Text style={[styles.fieldTitle, { color: themes[theme].fontDefault }]}>{field.title}</Text>
					<Markdown msg={field?.value || ''} username={user?.username} getCustomEmoji={getCustomEmoji} />
				</View>
			))}
		</View>
	);
};

const Reply = ({ attachment, timeFormat, getCustomEmoji, msg }: IMessageReply) => {
	'use memo';

	const [loading, setLoading] = useState(false);
	const { theme } = useTheme();
	const baseUrl = useBaseUrl();
	const user = useMessageUser();
	const id = useMessageId();
	const isEncrypted = useIsEncrypted();

	if (!attachment || isEncrypted) {
		return null;
	}

	const onPress = async () => {
		let url = attachment.title_link || attachment.author_link;
		if (!url) {
			return;
		}
		if (attachment.type === 'file' && attachment.title_link) {
			setLoading(true);
			url = formatAttachmentUrl(attachment.title_link, user?.id ?? '', user?.token ?? '', baseUrl ?? '');
			await fileDownloadAndPreview(url, attachment, id ?? '');
			setLoading(false);
			return;
		}
		openLink(url, theme);
	};

	let { strokeLight } = themes[theme];
	if (attachment.color) {
		strokeLight = attachment.color;
	}

	return (
		<View style={{ gap: 4 }}>
			<Touchable
				testID={`reply-${attachment?.author_name}-${attachment?.text}`}
				onPress={onPress}
				style={[
					styles.button,
					{
						borderColor: strokeLight
					}
				]}
				disabled={!!(loading || attachment.message_link)}>
				<View style={styles.attachmentContainer}>
					<View style={styles.titleAndDescriptionContainer}>
						<Title attachment={attachment} timeFormat={timeFormat} theme={theme} />
						<Description attachment={attachment} getCustomEmoji={getCustomEmoji} />
						<Quote attachments={attachment.attachments} timeFormat={timeFormat} />
						<Attachments attachments={attachment.attachments} timeFormat={timeFormat} />
						<Fields attachment={attachment} getCustomEmoji={getCustomEmoji} theme={theme} />
						{loading ? (
							<View style={styles.backdrop}>
								<View
									style={[
										styles.backdrop,
										{ backgroundColor: themes[theme].surfaceNeutral, opacity: themes[theme].attachmentLoadingOpacity }
									]}></View>
								<RCActivityIndicator />
							</View>
						) : null}
					</View>
					<UrlImage image={attachment.thumb_url} />
				</View>
			</Touchable>
			{msg ? <Markdown msg={msg} username={user?.username} getCustomEmoji={getCustomEmoji} /> : null}
		</View>
	);
};

Reply.displayName = 'MessageReply';
Title.displayName = 'MessageReplyTitle';
Description.displayName = 'MessageReplyDescription';
Fields.displayName = 'MessageReplyFields';

export default Reply;
