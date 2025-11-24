import React, { useContext } from 'react';
import { View, type ViewStyle } from 'react-native';
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
import { type IMessage, type IMessageInner, type IMessageTouchable } from './interfaces';
import { useTheme } from '../../theme';
import RightIcons from './Components/RightIcons';
import { WidthAwareView } from './Components/WidthAwareView';
import i18n from '../../i18n';
import { getInfoMessage } from './utils';
import MessageTime from './Time';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import Quote from './Components/Attachments/Quote';

const MessageInner = React.memo((props: IMessageInner) => {
	const { isLargeFontScale } = useResponsiveLayout();
	const showTimeLarge = isLargeFontScale && props.isHeader;

	let content;
	if (props.isPreview) {
		content = (
			<>
				<User {...props} />
				{showTimeLarge ? <MessageTime {...props} /> : null}
				<>
					<Quote {...props} />
					<Content {...props} />
					<Attachments {...props} />
				</>
				<Urls {...props} />
			</>
		);
	}

	if (props.type === 'discussion-created') {
		content = (
			<>
				<User {...props} />
				{showTimeLarge ? <MessageTime {...props} /> : null}
				<Discussion {...props} />
			</>
		);
	}

	if (props.type === 'jitsi_call_started') {
		content = (
			<>
				<User {...props} />
				<Content {...props} isInfo />
				<CallButton {...props} />
				{showTimeLarge ? <MessageTime {...props} /> : null}
			</>
		);
	}

	if (props.blocks && props.blocks.length) {
		content = (
			<>
				<User {...props} />
				<Blocks {...props} />
				<Thread {...props} />
				<Reactions {...props} />
				{showTimeLarge ? <MessageTime {...props} /> : null}
			</>
		);
	}

	if (!content) {
		content = (
			<>
				<User {...props} />
				{showTimeLarge ? <MessageTime {...props} /> : null}
				<View style={{ gap: 4 }}>
					<Quote {...props} />
					<Content {...props} />
					<Attachments {...props} />
					<Urls {...props} />
					<Thread {...props} />
					<Reactions {...props} />
					<Broadcast {...props} />
				</View>
			</>
		);
	}

	return <WidthAwareView>{content}</WidthAwareView>;
});
MessageInner.displayName = 'MessageInner';

const Message = React.memo((props: IMessageTouchable & IMessage) => {
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
	const accessibilityLabel = () => {
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

		const hour = props.ts ? new Date(props.ts).toLocaleTimeString() : '';
		const user = props.useRealName ? props.author?.name : props.author?.username || '';
		const readOrUnreadLabel =
			!props.unread && props.unread !== null ? i18n.t('Message_was_read') : i18n.t('Message_was_not_read');
		const readReceipt = props.isReadReceiptEnabled && !props.isInfo ? readOrUnreadLabel : '';
		const encryptedMessageLabel = props.isEncrypted ? i18n.t('Encrypted_message') : '';
		return `${user} ${hour} ${label}. ${encryptedMessageLabel} ${readReceipt}`;
	};

	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		// Prevent misalignment of info when the font size is increased.
		const infoStyle: ViewStyle = props.isInfo ? { alignItems: 'center' } : {};
		return (
			<View style={[styles.container, { marginTop: 4 }]}>
				{thread}
				<View accessible accessibilityLabel={accessibilityLabel()} style={[styles.flex, infoStyle]}>
					<MessageAvatar small {...props} />
					<View style={styles.messageContent}>
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
		<View testID={`message-${props.id}`} accessible accessibilityLabel={accessibilityLabel()} style={styles.container}>
			<View style={styles.flex}>
				<MessageAvatar {...props} />
				<View style={styles.messageContent}>
					<MessageInner {...props} />
				</View>
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
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props: IMessageTouchable & IMessage) => {
	const { onPress, onLongPress } = useContext(MessageContext);
	const { colors } = useTheme();

	let backgroundColor = undefined;
	if (props.isBeingEdited) {
		backgroundColor = colors.statusBackgroundWarning2;
	}
	if (props.highlighted) {
		backgroundColor = colors.surfaceNeutral;
	}

	if (props.hasError || props.isInfo) {
		return (
			<View>
				<Message {...props} />
			</View>
		);
	}

	return (
		<Touchable
			onLongPress={onLongPress}
			onPress={onPress}
			disabled={(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started'}
			style={{ backgroundColor }}>
			<Message {...props} />
		</Touchable>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
