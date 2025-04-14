import React, { useContext, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
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

const MessageInner = React.memo((props: IMessageInner) => {
	const { fontScale } = useWindowDimensions();

	const shouldAdjustLayoutForLargeFont = fontScale > 1.3;

	if (props.isPreview) {
		return (
			<>
				<User {...props} />
				<>
					<Content {...props} />
					<Attachments {...props} />
				</>
				<Urls {...props} />
				{shouldAdjustLayoutForLargeFont ? <MessageTime {...props} /> : null}
			</>
		);
	}

	if (props.type === 'discussion-created') {
		return (
			<>
				<User {...props} />
				<Discussion {...props} />
				{shouldAdjustLayoutForLargeFont ? <MessageTime {...props} /> : null}
			</>
		);
	}

	if (props.type === 'jitsi_call_started') {
		return (
			<>
				<User {...props} />
				<Content {...props} isInfo />
				<CallButton {...props} />
				{shouldAdjustLayoutForLargeFont ? <MessageTime {...props} /> : null}
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
				{shouldAdjustLayoutForLargeFont ? <MessageTime {...props} /> : null}
			</>
		);
	}

	return (
		<>
			<User {...props} />
			<>
				<Content {...props} />
				<Attachments {...props} />
			</>
			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
			{shouldAdjustLayoutForLargeFont ? <MessageTime {...props} /> : null}
		</>
	);
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

		const hour = props.ts ? new Date(props.ts).toLocaleTimeString() : '';
		const user = props.useRealName ? props.author?.name : props.author?.username || '';
		const readOrUnreadLabel =
			!props.unread && props.unread !== null ? i18n.t('Message_was_read') : i18n.t('Message_was_not_read');
		const readReceipt = props.isReadReceiptEnabled && !props.isInfo ? readOrUnreadLabel : '';
		const encryptedMessageLabel = props.isEncrypted ? i18n.t('Encrypted_message') : '';
		return `${user} ${hour} ${label}. ${encryptedMessageLabel} ${readReceipt}`;
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
		props.unread
	]);

	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		return (
			<View style={[styles.container, props.style]}>
				{thread}
				<View accessible accessibilityLabel={accessibilityLabel} style={styles.flex}>
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
			<View style={styles.flex}>
				<MessageAvatar {...props} />
				<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
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
