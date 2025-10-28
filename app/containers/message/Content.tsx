import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { dequal } from 'dequal';

import I18n from '../../i18n';
import styles from './styles';
import Markdown, { MarkdownPreview } from '../markdown';
import User from './User';
import { messageHaveAuthorName, getInfoMessage } from './utils';
import MessageContext from './Context';
import { type IMessageContent } from './interfaces';
import { useTheme } from '../../theme';
import { themes } from '../../lib/constants/colors';
import type { MessageTypesValues, IUserMessage } from '../../definitions';


const Content = React.memo(
	(props: IMessageContent & { author?: IUserMessage }) => {
		const { theme } = useTheme();
		const { user, onLinkPress } = useContext(MessageContext);

		if (props.isInfo) {
			// @ts-ignore
			const infoMessage = getInfoMessage({ ...props });

			const renderMessageContent = (
				<Text style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]} accessibilityLabel={infoMessage}>
					{infoMessage}
				</Text>
			);
			if (messageHaveAuthorName(props.type as MessageTypesValues)) {
				return (
					<Text>
						<User {...props} /> {renderMessageContent}
					</Text>
				);
			}

			return renderMessageContent;
		}

		const isPreview = props.tmid && !props.isThreadRoom;
		let content = null;

		if (props.isEncrypted) {
			content = (
				<Text
					style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]}
					accessibilityLabel={I18n.t('Encrypted_message')}
					testID='message-encrypted'>
					{I18n.t('Encrypted_message')}
				</Text>
			);
		} else if (isPreview) {
			content = <MarkdownPreview testID={`message-preview-${props.msg}`} msg={props.msg} />;
		} else if (props.msg) {
			content = (
				<Markdown
					msg={props.msg}
					md={props.type !== 'e2e' ? props.md : undefined}
					getCustomEmoji={props.getCustomEmoji}
					username={user.username}
					channels={props.channels}
					mentions={props.mentions}
					navToRoomInfo={props.navToRoomInfo}
					useRealName={props.useRealName}
					onLinkPress={onLinkPress}
					isTranslated={props.isTranslated}
				/>
			);
		}

		if (props.isIgnored) {
			content = (
				<Text style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]} testID={`message-ignored-${props.msg}`}>
					{I18n.t('Message_Ignored')}
				</Text>
			);
		}

		return content ? (
			<View style={props.isTemp && styles.temp} testID={`message-content-${props.msg || ''}`}>
				{content}
			</View>
		) : null;
	},
	(prevProps, nextProps) => {
		if (prevProps.isTemp !== nextProps.isTemp) {
			return false;
		}
		if (prevProps.msg !== nextProps.msg) {
			return false;
		}
		if (prevProps.type !== nextProps.type) {
			return false;
		}
		if (prevProps.isEncrypted !== nextProps.isEncrypted) {
			return false;
		}
		if (prevProps.isIgnored !== nextProps.isIgnored) {
			return false;
		}
		if (!dequal(prevProps.md, nextProps.md)) {
			return false;
		}
		if (!dequal(prevProps.mentions, nextProps.mentions)) {
			return false;
		}
		if (!dequal(prevProps.channels, nextProps.channels)) {
			return false;
		}
		return true;
	}
);

Content.displayName = 'MessageContent';

export default Content;
