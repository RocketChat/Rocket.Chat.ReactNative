import { Text, View } from 'react-native';

import I18n from '../../i18n';
import styles from './styles';
import Markdown, { MarkdownPreview } from '../markdown';
import User from './User';
import { messageHaveAuthorName, getInfoMessage, getPreviewMessageFromAttachment } from './utils';
import { type IMessageContent } from './interfaces';
import { useTheme } from '../../theme';
import { themes } from '../../lib/constants/colors';
import { type MessageTypesValues } from '../../definitions';
import {
	useContentData,
	useIsEncrypted,
	useIsInfo,
	useMessageAuthor,
	useMessageStatus,
	useMessageText,
	useOnLinkPress
} from './MessageStore';
import { useGetCustomEmoji, useMessageUser, useNavToRoomInfo } from './MessageRoomStore';

const Content = (props: IMessageContent) => {
	'use memo';

	const { theme } = useTheme();
	const user = useMessageUser();
	const onLinkPress = useOnLinkPress();
	const getCustomEmoji = useGetCustomEmoji() ?? (() => null);
	const navToRoomInfo = useNavToRoomInfo();

	const isInfo = useIsInfo();
	const isEncrypted = useIsEncrypted();
	const { md, mentions, channels, comment, attachments, t: type } = useContentData();
	const { isTemp } = useMessageStatus();
	const { messageText, isTranslated } = useMessageText();
	const { u: author, role } = useMessageAuthor();

	if (isInfo) {
		// @ts-ignore
		const infoMessage = getInfoMessage({ type, role, msg: messageText, author, comment });

		const renderMessageContent = (
			<Text style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]} accessibilityLabel={infoMessage}>
				{infoMessage}
			</Text>
		);
		if (messageHaveAuthorName(type as MessageTypesValues)) {
			return (
				<Text>
					<User useRealName={props.useRealName} /> {renderMessageContent}
				</Text>
			);
		}

		return renderMessageContent;
	}

	const isPreview = props.tmid && !props.isThreadRoom;
	let content = null;

	if (isEncrypted) {
		content = (
			<Text
				style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]}
				accessibilityLabel={I18n.t('Encrypted_message')}
				testID='message-encrypted'>
				{I18n.t('Encrypted_message')}
			</Text>
		);
	} else if (isPreview) {
		const previewMsg =
			messageText ||
			(attachments?.length ? getPreviewMessageFromAttachment(attachments[0], props.autoTranslateLanguage) : undefined);
		content = previewMsg ? <MarkdownPreview testID={`message-preview-${previewMsg}`} msg={previewMsg} /> : null;
	} else if (messageText) {
		content = (
			<Markdown
				msg={messageText}
				md={type !== 'e2e' ? md : undefined}
				getCustomEmoji={getCustomEmoji}
				username={user?.username ?? ''}
				channels={channels}
				mentions={mentions}
				navToRoomInfo={navToRoomInfo}
				useRealName={props.useRealName}
				onLinkPress={onLinkPress}
				isTranslated={isTranslated}
			/>
		);
	}

	if (props.isIgnored) {
		content = (
			<Text style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]} testID={`message-ignored-${messageText}`}>
				{I18n.t('Message_Ignored')}
			</Text>
		);
	}

	return content ? (
		<View style={isTemp && styles.temp} testID={`message-content-${messageText || ''}`}>
			{content}
		</View>
	) : null;
};

Content.displayName = 'MessageContent';

export default Content;
