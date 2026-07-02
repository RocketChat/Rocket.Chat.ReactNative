import { useState } from 'react';
import { View, type ViewStyle, type AccessibilityActionEvent, type AccessibilityActionInfo } from 'react-native';
import { A11y } from 'react-native-a11y-order';

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
import { useTheme } from '../../theme';
import RightIcons from './Components/RightIcons';
import { WidthAwareView } from './Components/WidthAwareView';
import MessageTime from './Time';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import Quote from './Components/Attachments/Quote';
import Touch from './Touch';
import { useLastFocusedMessageRef } from '../../lib/a11y/useLastFocusedMessageRef';
import { useMessageAccessibilityLabel } from './hooks/useMessageAccessibilityLabel';
import { useMessageAccessibilityActions } from './hooks/useMessageAccessibilityActions';
import { useMessageAccessibilityHint } from './hooks/useMessageAccessibilityHint';
import { useIsBeingEdited } from '../../views/RoomView/InteractionStore';
import { useArchived } from './MessageRoomStore';
import {
	useBlocks,
	useContentData,
	useIsEdited,
	useIsInfo,
	useMessageAuthor,
	useMessageField,
	useMessageGrouping,
	useMessageLongPress,
	useMessageMeta,
	useMessagePress,
	useMessageStatus,
	useMessageText,
	useThreadData,
	useThreadPosition
} from './MessageStore';

type TMessageProps = {
	timeFormat?: string;
	useRealName?: boolean;
	isReadReceiptEnabled?: boolean;
	isThreadRoom: boolean;
	isPreview?: boolean;
	highlighted?: boolean;
	isIgnored: boolean;
	isBeingEdited?: boolean;
	autoTranslateLanguage?: string;
	small?: boolean;
};

interface IMessageA11y {
	accessibilityActions?: AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
	handleLongPress?: () => void;
}

const MessageInner = (props: TMessageProps) => {
	'use memo';

	const { isLargeFontScale } = useResponsiveLayout();
	const isHeader = useMessageGrouping();
	const { attachments, t: type } = useContentData();
	const { blocks } = useBlocks();
	const { tmid } = useThreadData();
	const { u: author } = useMessageAuthor();
	const showTimeLarge = isLargeFontScale && isHeader;

	let content;
	if (props.isPreview) {
		content = (
			<>
				<User useRealName={props.useRealName} timeFormat={props.timeFormat} isReadReceiptEnabled={props.isReadReceiptEnabled} />
				{showTimeLarge ? <MessageTime timeFormat={props.timeFormat} /> : null}
				<>
					<Quote attachments={attachments} timeFormat={props.timeFormat} author={author} />
					<Content
						tmid={tmid}
						isThreadRoom={props.isThreadRoom}
						useRealName={props.useRealName}
						isIgnored={props.isIgnored}
						autoTranslateLanguage={props.autoTranslateLanguage}
					/>
					<Attachments attachments={attachments} timeFormat={props.timeFormat} author={author} />
				</>
				<Urls />
			</>
		);
	}

	if (type === 'discussion-created') {
		content = (
			<>
				<User useRealName={props.useRealName} timeFormat={props.timeFormat} isReadReceiptEnabled={props.isReadReceiptEnabled} />
				{showTimeLarge ? <MessageTime timeFormat={props.timeFormat} /> : null}
				<Discussion />
			</>
		);
	}

	if (type === 'jitsi_call_started') {
		content = (
			<>
				<User useRealName={props.useRealName} timeFormat={props.timeFormat} isReadReceiptEnabled={props.isReadReceiptEnabled} />
				<Content
					tmid={tmid}
					isThreadRoom={props.isThreadRoom}
					useRealName={props.useRealName}
					isIgnored={props.isIgnored}
					autoTranslateLanguage={props.autoTranslateLanguage}
				/>
				<CallButton />
				{showTimeLarge ? <MessageTime timeFormat={props.timeFormat} /> : null}
			</>
		);
	}

	if (blocks && blocks.length) {
		content = (
			<>
				<User useRealName={props.useRealName} timeFormat={props.timeFormat} isReadReceiptEnabled={props.isReadReceiptEnabled} />
				<Blocks />
				<Thread isThreadRoom={props.isThreadRoom} />
				<Reactions />
				{showTimeLarge ? <MessageTime timeFormat={props.timeFormat} /> : null}
			</>
		);
	}

	if (!content) {
		content = (
			<>
				<User useRealName={props.useRealName} timeFormat={props.timeFormat} isReadReceiptEnabled={props.isReadReceiptEnabled} />
				{showTimeLarge ? <MessageTime timeFormat={props.timeFormat} /> : null}
				<View style={{ gap: 4 }}>
					<Quote attachments={attachments} timeFormat={props.timeFormat} author={author} />
					<Content
						tmid={tmid}
						isThreadRoom={props.isThreadRoom}
						useRealName={props.useRealName}
						isIgnored={props.isIgnored}
						autoTranslateLanguage={props.autoTranslateLanguage}
					/>
					<Attachments attachments={attachments} timeFormat={props.timeFormat} author={author} />
					<Urls />
					<Thread isThreadRoom={props.isThreadRoom} />
					<Reactions />
					<Broadcast />
				</View>
			</>
		);
	}

	return <WidthAwareView>{content}</WidthAwareView>;
};
MessageInner.displayName = 'MessageInner';

const Message = (props: TMessageProps & IMessageA11y) => {
	'use memo';

	const isHeader = useMessageGrouping();
	const { isThreadReply, isThreadSequential } = useThreadPosition();
	const isInfo = useIsInfo();
	const { messageText, isTranslated } = useMessageText();
	const { attachments, t: type } = useContentData();
	const { tmid } = useThreadData();
	const { u: author } = useMessageAuthor();
	const id = useMessageField(item => item.id);
	const isEdited = useIsEdited();
	const { hasError } = useMessageStatus();
	const { unread, pinned } = useMessageMeta();

	if (isThreadReply || isThreadSequential || isInfo || props.isIgnored) {
		const thread = isThreadReply ? <RepliedThread isHeader={isHeader} /> : null;
		const infoStyle: ViewStyle = isInfo ? { alignItems: 'center' } : {};
		return (
			<View style={[styles.container, { marginTop: 4 }]}>
				{thread}
				<View style={[styles.flex, infoStyle]}>
					<MessageAvatar small />
					<A11y.Index
						accessible={isTranslated}
						accessibilityLabel={messageText || ''}
						accessibilityLanguage={props.autoTranslateLanguage}
						index={2}
						style={{ flex: 1 }}>
						<View style={styles.messageContent}>
							<Content
								tmid={tmid}
								isThreadRoom={props.isThreadRoom}
								useRealName={props.useRealName}
								isIgnored={props.isIgnored}
								autoTranslateLanguage={props.autoTranslateLanguage}
							/>
							{isInfo && type === 'message_pinned' ? (
								<View pointerEvents='none'>
									<Attachments attachments={attachments} timeFormat={props.timeFormat} author={author} />
								</View>
							) : null}
						</View>
					</A11y.Index>
				</View>
			</View>
		);
	}

	return (
		<View testID={`message-${id}`} style={styles.container}>
			<A11y.Index
				accessible={isTranslated}
				accessibilityLabel={messageText || ''}
				accessibilityLanguage={props.autoTranslateLanguage}
				index={2}>
				<View style={styles.flex}>
					<MessageAvatar />
					<View style={styles.messageContent}>
						<MessageInner
							timeFormat={props.timeFormat}
							useRealName={props.useRealName}
							isReadReceiptEnabled={props.isReadReceiptEnabled}
							isThreadRoom={props.isThreadRoom}
							isPreview={props.isPreview}
							highlighted={props.highlighted}
							isIgnored={props.isIgnored}
							isBeingEdited={props.isBeingEdited}
							autoTranslateLanguage={props.autoTranslateLanguage}
							small={props.small}
						/>
					</View>
					{!isHeader ? (
						<RightIcons
							type={type}
							msg={messageText}
							isEdited={isEdited}
							hasError={hasError}
							isReadReceiptEnabled={props.isReadReceiptEnabled}
							unread={unread}
							pinned={pinned}
							isTranslated={isTranslated}
						/>
					) : null}
				</View>
			</A11y.Index>
		</View>
	);
};
Message.displayName = 'Message';

const MessageTouchable = (props: TMessageProps) => {
	'use memo';

	const { colors } = useTheme();
	const { ref: touchRef, markAsLastFocused } = useLastFocusedMessageRef();
	const { isThreadReply } = useThreadPosition();
	const isInfo = useIsInfo();
	const archived = useArchived();
	const { hasError, isTemp } = useMessageStatus();
	const type = useMessageField(item => item.t);
	const id = useMessageField(item => item.id);
	const isBeingEdited = useIsBeingEdited(id);
	const [isManualUnignored, setIsManualUnignored] = useState(false);
	const isIgnored = isManualUnignored ? false : props.isIgnored ?? false;
	const revealIgnored = () => setIsManualUnignored(true);
	const onPressAction = useMessagePress({ isIgnored, revealIgnored });
	const onLongPress = useMessageLongPress();
	const accessibilityLabelValue = useMessageAccessibilityLabel({
		useRealName: props.useRealName,
		isReadReceiptEnabled: props.isReadReceiptEnabled,
		autoTranslateLanguage: props.autoTranslateLanguage
	});
	const isDisabled = (isInfo && !isThreadReply) || archived || isTemp || type === 'jitsi_call_started';
	const accessibilityActions = useMessageAccessibilityActions(isDisabled);
	const accessibilityHint = useMessageAccessibilityHint();

	let backgroundColor = undefined;
	if (isBeingEdited) {
		backgroundColor = colors.statusBackgroundWarning2;
	}
	if (props.highlighted) {
		backgroundColor = colors.surfaceNeutral;
	}

	if (hasError || isInfo) {
		return (
			<A11y.Order>
				<Message
					timeFormat={props.timeFormat}
					useRealName={props.useRealName}
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					isThreadRoom={props.isThreadRoom}
					isPreview={props.isPreview}
					highlighted={props.highlighted}
					isIgnored={isIgnored}
					isBeingEdited={isBeingEdited}
					autoTranslateLanguage={props.autoTranslateLanguage}
					small={props.small}
				/>
			</A11y.Order>
		);
	}

	const handleLongPress = () => {
		markAsLastFocused();
		onLongPress();
	};

	return (
		<A11y.Order>
			<A11y.Index index={1}>
				<Touch
					componentRef={touchRef}
					onLongPress={handleLongPress}
					onPress={onPressAction}
					disabled={isDisabled}
					style={{ backgroundColor }}
					testID={isBeingEdited ? `message-editing-${id}` : undefined}
					accessible
					accessibilityRole='button'
					accessibilityLabel={accessibilityLabelValue}
					accessibilityHint={accessibilityHint}
					accessibilityActions={accessibilityActions}
					onAccessibilityAction={e => {
						if (e.nativeEvent.actionName === 'showActions') handleLongPress();
					}}>
					<Message
						timeFormat={props.timeFormat}
						useRealName={props.useRealName}
						isReadReceiptEnabled={props.isReadReceiptEnabled}
						isThreadRoom={props.isThreadRoom}
						isPreview={props.isPreview}
						highlighted={props.highlighted}
						isIgnored={isIgnored}
						isBeingEdited={isBeingEdited}
						autoTranslateLanguage={props.autoTranslateLanguage}
						small={props.small}
						handleLongPress={!isDisabled ? handleLongPress : undefined}
					/>
				</Touch>
			</A11y.Index>
		</A11y.Order>
	);
};

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
