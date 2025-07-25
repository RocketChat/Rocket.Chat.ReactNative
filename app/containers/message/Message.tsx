import React, { useContext, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import MessageContext from './Context';
import User from './User';
import styles from './styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Attachments from './Components/Attachments';
import Urls from './Urls';
import Thread from './Thread';
import Blocks from './Blocks';
import Reactions from './Reactions';
import Broadcast from './Broadcast';
import Discussion from './Discussion';
import Content from './Content';
import CallButton from './CallButton';
import { themes } from '../../lib/constants';
import { IMessage, IMessageInner, IMessageTouchable } from './interfaces';
import { useTheme } from '../../theme';
import RightIcons from './Components/RightIcons';
import i18n from '../../i18n';
import { getInfoMessage } from './utils';
import MessageTime from './Time';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { A11yContainer, A11yElement } from '../A11yFlow';
import normalizeToBCP47 from '../../views/AutoTranslateView/utils/normalizeToBCP47ByName';

const MessageInner = React.memo((props: IMessageInner) => {
	const { isLargeFontScale } = useResponsiveLayout();

	if (props.isPreview) {
		return (
			<>
				<User {...props} />
				{isLargeFontScale ? <MessageTime {...props} /> : null}
				<>
					<Content {...props} />
					<Attachments {...props} />
				</>
				<Urls {...props} />
			</>
		);
	}

	if (props.type === 'discussion-created') {
		return (
			<>
				<User {...props} />
				{isLargeFontScale ? <MessageTime {...props} /> : null}
				<Discussion {...props} />
			</>
		);
	}

	if (props.type === 'jitsi_call_started') {
		return (
			<>
				<User {...props} />
				<Content {...props} isInfo />
				<CallButton {...props} />
				{isLargeFontScale ? <MessageTime {...props} /> : null}
			</>
		);
	}

	if (props.blocks && props.blocks.length) {
		return (
			<>
				<User {...props} />
				<Blocks {...props} />
				<Thread {...props} />
				<Reactions {...props} />
				{isLargeFontScale ? <MessageTime {...props} /> : null}
			</>
		);
	}

	return (
		<>
			<User {...props} />
			{isLargeFontScale ? <MessageTime {...props} /> : null}
			<>
				<Content {...props} />
				<Attachments {...props} />
			</>
			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
		</>
	);
});
MessageInner.displayName = 'MessageInner';

const Message = React.memo((props: IMessageTouchable & IMessage & { autoTranslateLanguage?: string }) => {
	const handleMentionsOnAccessibilityLabel = (label: string) => {
		const { mentions = [], channels = [] } = props;

		mentions.forEach(item => {
			if (item?.username) {
				label = label.replaceAll(`@${item.username}`, item.username);
			}
		});

		channels.forEach(item => {
			if (item?.name) {
				label = label.replaceAll(`#${item.name}`, item.name);
			}
		});

		return label;
	};

	// temp accessibilityLabel
	const accessibilityLabel = useMemo(() => {
		let label = '';
		label = props.isInfo ? (props.msg as string) : `${props.tmid ? `thread message ${props.msg}` : props.msg}`;

		if (props.isThreadReply) {
			label = `replying to ${props.tmid ? `thread message ${props.msg}` : props}`;
		}
		if (props.isThreadSequential) {
			label = `thread message ${props.msg}`;
		}
		if (props.isEncrypted) {
			label = i18n.t('Encrypted_message');
		}
		if (props.isInfo) {
			// @ts-ignore
			label = getInfoMessage({ ...props });
		}
		label = handleMentionsOnAccessibilityLabel(label);

		const translated = props.isTranslated ? i18n.t('Message_translated_into_idiom', { idiom: props?.autoTranslateLanguage }) : '';
		const hour = props.ts ? new Date(props.ts).toLocaleTimeString() : '';
		const user = props.useRealName ? props.author?.name : props.author?.username || '';
		const readOrUnreadLabel =
			!props.unread && props.unread !== null ? i18n.t('Message_was_read') : i18n.t('Message_was_not_read');
		const readReceipt = props.isReadReceiptEnabled && !props.isInfo ? readOrUnreadLabel : '';
		const encryptedMessageLabel = props.isEncrypted ? i18n.t('Encrypted_message') : '';
		return props.isTranslated
			? `${user} ${hour} ${translated}`
			: `${user} ${hour} ${translated} ${label}. ${encryptedMessageLabel} ${readReceipt}`;
	}, [
		props.msg,
		props.tmid,
		props.isThreadReply,
		props.isThreadSequential,
		props.isEncrypted,
		props.isInfo,
		props.ts,
		props.useRealName,
		props.author,
		props.mentions,
		props.channels,
		props.unread,
		props.isTranslated,
		props?.autoTranslateLanguage
	]);
	const readOrUnreadLabel = !props.unread && props.unread !== null ? i18n.t('Message_was_read') : i18n.t('Message_was_not_read');
	const encryptedMessageLabel = props.isEncrypted ? i18n.t('Encrypted_message') : '';
	const readReceipt = props.isReadReceiptEnabled && !props.isInfo ? readOrUnreadLabel : '';
	const a11yLanguage = normalizeToBCP47(props?.autoTranslateLanguage || 'en-US');
	console.log(a11yLanguage, props.isTranslated, props?.msg);
	const translatedEncryptedAndReadReceipt = `${encryptedMessageLabel} ${readReceipt}`;
	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		// Prevent misalignment of info when the font size is increased.
		const infoStyle: ViewStyle = props.isInfo ? { alignItems: 'center' } : {};
		return (
			<View style={[styles.container, props.style]}>
				{thread}
				<View accessible accessibilityLabel={accessibilityLabel} style={[styles.flex, infoStyle]}>
					<MessageAvatar small {...props} />
					<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
						<Content {...props} />
						{props.isInfo && props.type === 'message_pinned' ? (
							<View pointerEvents='none'>
								<Attachments {...props} />
							</View>
						) : null}
					</View>
				</View>
			</View>
		);
	}

	return (
		<View accessible accessibilityLabel={accessibilityLabel} style={[styles.container, props.style]}>
			<A11yElement accessible={props.isTranslated} accessibilityLabel={props.msg} accessibilityLanguage={a11yLanguage} order={2}>
				<View style={styles.flex}>
					<MessageAvatar {...props} />
					<A11yElement accessible={props.isTranslated} accessibilityLabel={translatedEncryptedAndReadReceipt} order={3}>
						<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
							<MessageInner {...props} />
						</View>
					</A11yElement>
					{!props.isHeader ? (
						<RightIcons
							type={props.type}
							msg={props.msg}
							isEdited={props.isEdited}
							hasError={props.hasError}
							isReadReceiptEnabled={props.isReadReceiptEnabled}
							unread={props.unread}
							pinned={props.pinned}
							isTranslated={props.isTranslated}
						/>
					) : null}
				</View>
			</A11yElement>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props: IMessageTouchable & IMessage & { autoTranslateLanguage?: string }) => {
	const { onPress, onLongPress } = useContext(MessageContext);
	const { theme } = useTheme();

	let backgroundColor = undefined;
	if (props.isBeingEdited) {
		backgroundColor = themes[theme].statusBackgroundWarning2;
	}
	if (props.highlighted) {
		backgroundColor = themes[theme].surfaceNeutral;
	}

	if (props.hasError || props.isInfo) {
		return (
			<View>
				<Message {...props} />
			</View>
		);
	}

	return (
		<A11yContainer>
			<A11yElement order={1}>
				<Touchable
					onLongPress={onLongPress}
					onPress={onPress}
					disabled={
						(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started'
					}
					style={{ backgroundColor }}>
					<Message {...props} />
				</Touchable>
			</A11yElement>
		</A11yContainer>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
