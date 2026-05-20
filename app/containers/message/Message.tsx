import React, { useContext } from 'react';
import { View, type ViewStyle } from 'react-native';
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
import MessageTime from './Time';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useMessageAccessibilityLabel } from './hooks/useMessageAccessibilityLabel';
import Quote from './Components/Attachments/Quote';
import Touch from './Touch';

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
	const accessibilityLabel = useMessageAccessibilityLabel(props);

	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		// Prevent misalignment of info when the font size is increased.
		const infoStyle: ViewStyle = props.isInfo ? { alignItems: 'center' } : {};
		return (
			<View style={[styles.container, { marginTop: 4 }]}>
				{thread}
				<View accessible accessibilityLabel={accessibilityLabel} style={[styles.flex, infoStyle]}>
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
		<View testID={`message-${props.id}`} accessible accessibilityLabel={accessibilityLabel} style={styles.container}>
			<A11y.Index
				accessible={props.isTranslated}
				accessibilityLabel={props?.msg || ''}
				accessibilityLanguage={props.autoTranslateLanguage}
				index={2}>
				<View accessible style={styles.flex}>
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

	return (
		<A11y.Order>
			<A11y.Index index={1}>
				<Touch
					onLongPress={onLongPress}
					onPress={onPress}
					disabled={
						(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started'
					}
					style={{ backgroundColor }}>
					<Message {...props} />
				</Touch>
			</A11y.Index>
		</A11y.Order>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
