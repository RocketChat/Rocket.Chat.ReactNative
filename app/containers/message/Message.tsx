import React, { useContext, useRef } from 'react';
import { View, type ViewStyle, type AccessibilityActionEvent, type AccessibilityActionInfo } from 'react-native';
import { A11y } from 'react-native-a11y-order';

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
import translationLanguages from '../../lib/constants/translationLanguages';
import Touch from './Touch';
import { useLastFocusedMessageRef } from '../../lib/a11y/useLastFocusedMessageRef';

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

interface IMessageA11y {
	accessibilityActions?: AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
	handleLongPress?: () => void;
}

const getMessageAccessibilityLabel = (props: IMessageTouchable & IMessage & IMessageA11y) => {
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
	const readOrUnreadLabel = !props.unread && props.unread !== null ? i18n.t('Message_was_read') : i18n.t('Message_was_not_read');
	const readReceipt = props.isReadReceiptEnabled && !props.isInfo ? readOrUnreadLabel : '';
	const encryptedMessageLabel = props.isEncrypted ? i18n.t('Encrypted_message') : '';
	const translatedLanguage = translationLanguages[props?.autoTranslateLanguage || 'en'];
	const translated = props.isTranslated ? i18n.t('Message_translated_into_idiom', { idiom: translatedLanguage }) : '';
	return props.isTranslated
		? `${user} ${hour} ${translated}`
		: `${user} ${hour} ${translated} ${label}. ${encryptedMessageLabel} ${readReceipt}`;
};

const getMessageAccessibilityActions = (isDisabled: boolean): AccessibilityActionInfo[] | undefined => {
	if (isDisabled) {
		return undefined;
	}
	return [{ name: 'showActions', label: i18n.t('Show_message_actions') }];
};

const Message = React.memo((props: IMessageTouchable & IMessage & IMessageA11y) => {
	const accessibilityLabelValue = getMessageAccessibilityLabel(props);

	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		// Prevent misalignment of info when the font size is increased.
		const infoStyle: ViewStyle = props.isInfo ? { alignItems: 'center' } : {};
		return (
			<View style={[styles.container, { marginTop: 4 }]}>
				{thread}
				<View
					accessible
					accessibilityLabel={accessibilityLabelValue}
					accessibilityActions={props.accessibilityActions}
					onAccessibilityAction={e => {
						if (e.nativeEvent.actionName === 'showActions') {
							props.handleLongPress?.();
						}
					}}
					style={[styles.flex, infoStyle]}>
					<MessageAvatar small {...props} />
					<A11y.Index
						accessible={props.isTranslated}
						accessibilityLabel={props?.msg || ''}
						accessibilityLanguage={props.autoTranslateLanguage}
						index={2}
						style={{ flex: 1 }}>
						<View style={styles.messageContent}>
							<Content {...props} />
							{props.isInfo && props.type === 'message_pinned' ? (
								<View pointerEvents='none'>
									<Attachments {...props} />
								</View>
							) : null}
						</View>
					</A11y.Index>
				</View>
			</View>
		);
	}

	return (
		<View testID={`message-${props.id}`} style={styles.container}>
			<A11y.Index
				accessible={props.isTranslated}
				accessibilityLabel={props?.msg || ''}
				accessibilityLanguage={props.autoTranslateLanguage}
				index={2}>
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
			</A11y.Index>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props: IMessageTouchable & IMessage) => {
	const { onPress, onLongPress } = useContext(MessageContext);
	const { colors } = useTheme();
	const touchRef = useRef<View>(null);
	const lastFocusedMessageRef = useLastFocusedMessageRef();
	const accessibilityLabelValue = getMessageAccessibilityLabel(props);

	let backgroundColor = undefined;
	if (props.isBeingEdited) {
		backgroundColor = colors.statusBackgroundWarning2;
	}
	if (props.highlighted) {
		backgroundColor = colors.surfaceNeutral;
	}

	if (props.hasError || props.isInfo) {
		return (
			<A11y.Order>
				<Message {...props} />
			</A11y.Order>
		);
	}

	const isDisabled =
		(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started';

	const handleLongPress = () => {
		lastFocusedMessageRef.set(touchRef);
		onLongPress();
	};

	const accessibilityActions = getMessageAccessibilityActions(isDisabled);

	return (
		<A11y.Order>
			<A11y.Index index={1}>
				<Touch
					componentRef={touchRef}
					onLongPress={handleLongPress}
					onPress={onPress}
					disabled={isDisabled}
					style={{ backgroundColor }}
					accessible
					accessibilityRole='button'
					accessibilityLabel={accessibilityLabelValue}
					accessibilityActions={accessibilityActions}
					onAccessibilityAction={e => {
						if (e.nativeEvent.actionName === 'showActions') handleLongPress();
					}}>
					<Message {...props} handleLongPress={!isDisabled ? handleLongPress : undefined} />
				</Touch>
			</A11y.Index>
		</A11y.Order>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
