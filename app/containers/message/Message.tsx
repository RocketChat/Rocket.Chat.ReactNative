import { useContext, memo } from 'react';
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
import {
	type IMessageAttachments,
	type IMessageAvatar,
	type IMessageBlocks,
	type IMessageBroadcast,
	type IMessageContent,
	type IMessageRepliedThread,
	type IMessageThread,
	type IMessageTouchable
} from './interfaces';
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

type TMessageProps = IMessageContent &
	IMessageAttachments &
	IMessageThread &
	IMessageBlocks &
	IMessageBroadcast &
	IMessageAvatar &
	IMessageRepliedThread &
	IMessageTouchable & {
		isReadReceiptEnabled?: boolean;
		unread?: boolean;
		dcount?: number;
		dlm?: Date | string;
		isThreadSequential: boolean;
		isPreview?: boolean;
	};

interface IMessageA11y {
	accessibilityActions?: AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
	handleLongPress?: () => void;
}

const MessageInner = memo((props: TMessageProps) => {
	const { isLargeFontScale } = useResponsiveLayout();
	const showTimeLarge = isLargeFontScale && props.isHeader;

	let content;
	if (props.isPreview) {
		content = (
			<>
				<User
					isHeader={props.isHeader}
					hasError={props.hasError}
					useRealName={props.useRealName}
					author={props.author}
					alias={props.alias}
					ts={props.ts as Date | undefined}
					timeFormat={props.timeFormat}
					isEdited={props.isEdited}
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					unread={props.unread}
					pinned={props.pinned}
					isTranslated={props.isTranslated}
					type={props.type}
				/>
				{showTimeLarge ? <MessageTime ts={props.ts as Date | undefined} timeFormat={props.timeFormat} /> : null}
				<>
					<Quote attachments={props.attachments} timeFormat={props.timeFormat} author={props.author} />
					<Content
						isTemp={props.isTemp}
						isInfo={props.isInfo}
						tmid={props.tmid}
						isThreadRoom={props.isThreadRoom}
						msg={props.msg}
						md={props.md}
						isEdited={props.isEdited}
						isEncrypted={props.isEncrypted}
						channels={props.channels}
						mentions={props.mentions}
						useRealName={props.useRealName}
						isIgnored={props.isIgnored}
						type={props.type}
						comment={props.comment}
						hasError={props.hasError}
						isHeader={props.isHeader}
						isTranslated={props.isTranslated}
						pinned={props.pinned}
						attachments={props.attachments}
						autoTranslateLanguage={props.autoTranslateLanguage}
						author={props.author}
						alias={props.alias}
						role={props.role}
					/>
					<Attachments attachments={props.attachments} timeFormat={props.timeFormat} author={props.author} />
				</>
				<Urls urls={props.urls} />
			</>
		);
	}

	if (props.type === 'discussion-created') {
		content = (
			<>
				<User
					isHeader={props.isHeader}
					hasError={props.hasError}
					useRealName={props.useRealName}
					author={props.author}
					alias={props.alias}
					ts={props.ts as Date | undefined}
					timeFormat={props.timeFormat}
					isEdited={props.isEdited}
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					unread={props.unread}
					pinned={props.pinned}
					isTranslated={props.isTranslated}
					type={props.type}
				/>
				{showTimeLarge ? <MessageTime ts={props.ts as Date | undefined} timeFormat={props.timeFormat} /> : null}
				<Discussion msg={props.msg} dcount={props.dcount} dlm={props.dlm} />
			</>
		);
	}

	if (props.type === 'jitsi_call_started') {
		content = (
			<>
				<User
					isHeader={props.isHeader}
					hasError={props.hasError}
					useRealName={props.useRealName}
					author={props.author}
					alias={props.alias}
					ts={props.ts as Date | undefined}
					timeFormat={props.timeFormat}
					isEdited={props.isEdited}
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					unread={props.unread}
					pinned={props.pinned}
					isTranslated={props.isTranslated}
					type={props.type}
				/>
				<Content
					isTemp={props.isTemp}
					isInfo
					tmid={props.tmid}
					isThreadRoom={props.isThreadRoom}
					msg={props.msg}
					md={props.md}
					isEdited={props.isEdited}
					isEncrypted={props.isEncrypted}
					channels={props.channels}
					mentions={props.mentions}
					useRealName={props.useRealName}
					isIgnored={props.isIgnored}
					type={props.type}
					comment={props.comment}
					hasError={props.hasError}
					isHeader={props.isHeader}
					isTranslated={props.isTranslated}
					pinned={props.pinned}
					attachments={props.attachments}
					autoTranslateLanguage={props.autoTranslateLanguage}
					author={props.author}
					alias={props.alias}
					role={props.role}
				/>
				<CallButton />
				{showTimeLarge ? <MessageTime ts={props.ts as Date | undefined} timeFormat={props.timeFormat} /> : null}
			</>
		);
	}

	if (props.blocks && props.blocks.length) {
		content = (
			<>
				<User
					isHeader={props.isHeader}
					hasError={props.hasError}
					useRealName={props.useRealName}
					author={props.author}
					alias={props.alias}
					ts={props.ts as Date | undefined}
					timeFormat={props.timeFormat}
					isEdited={props.isEdited}
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					unread={props.unread}
					pinned={props.pinned}
					isTranslated={props.isTranslated}
					type={props.type}
				/>
				<Blocks blocks={props.blocks} id={props.id} rid={props.rid} />
				<Thread msg={props.msg} tcount={props.tcount} tlm={props.tlm} id={props.id} isThreadRoom={props.isThreadRoom} />
				<Reactions reactions={props.reactions} />
				{showTimeLarge ? <MessageTime ts={props.ts as Date | undefined} timeFormat={props.timeFormat} /> : null}
			</>
		);
	}

	if (!content) {
		content = (
			<>
				<User
					isHeader={props.isHeader}
					hasError={props.hasError}
					useRealName={props.useRealName}
					author={props.author}
					alias={props.alias}
					ts={props.ts as Date | undefined}
					timeFormat={props.timeFormat}
					isEdited={props.isEdited}
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					unread={props.unread}
					pinned={props.pinned}
					isTranslated={props.isTranslated}
					type={props.type}
				/>
				{showTimeLarge ? <MessageTime ts={props.ts as Date | undefined} timeFormat={props.timeFormat} /> : null}
				<View style={{ gap: 4 }}>
					<Quote attachments={props.attachments} timeFormat={props.timeFormat} author={props.author} />
					<Content
						isTemp={props.isTemp}
						isInfo={props.isInfo}
						tmid={props.tmid}
						isThreadRoom={props.isThreadRoom}
						msg={props.msg}
						md={props.md}
						isEdited={props.isEdited}
						isEncrypted={props.isEncrypted}
						channels={props.channels}
						mentions={props.mentions}
						useRealName={props.useRealName}
						isIgnored={props.isIgnored}
						type={props.type}
						comment={props.comment}
						hasError={props.hasError}
						isHeader={props.isHeader}
						isTranslated={props.isTranslated}
						pinned={props.pinned}
						attachments={props.attachments}
						autoTranslateLanguage={props.autoTranslateLanguage}
						author={props.author}
						alias={props.alias}
						role={props.role}
					/>
					<Attachments attachments={props.attachments} timeFormat={props.timeFormat} author={props.author} />
					<Urls urls={props.urls} />
					<Thread msg={props.msg} tcount={props.tcount} tlm={props.tlm} id={props.id} isThreadRoom={props.isThreadRoom} />
					<Reactions reactions={props.reactions} />
					<Broadcast author={props.author} broadcast={props.broadcast} />
				</View>
			</>
		);
	}

	return <WidthAwareView>{content}</WidthAwareView>;
});
MessageInner.displayName = 'MessageInner';

const Message = memo((props: TMessageProps & IMessageA11y) => {
	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? (
			<RepliedThread
				tmid={props.tmid}
				tmsg={props.tmsg}
				id={props.id}
				isHeader={props.isHeader}
				isEncrypted={props.isEncrypted}
			/>
		) : null;
		const infoStyle: ViewStyle = props.isInfo ? { alignItems: 'center' } : {};
		return (
			<View style={[styles.container, { marginTop: 4 }]}>
				{thread}
				<View style={[styles.flex, infoStyle]}>
					<MessageAvatar isHeader={props.isHeader} avatar={props.avatar} emoji={props.emoji} author={props.author} small />
					<A11y.Index
						accessible={props.isTranslated}
						accessibilityLabel={props?.msg || ''}
						accessibilityLanguage={props.autoTranslateLanguage}
						index={2}
						style={{ flex: 1 }}>
						<View style={styles.messageContent}>
							<Content
								isTemp={props.isTemp}
								isInfo={props.isInfo}
								tmid={props.tmid}
								isThreadRoom={props.isThreadRoom}
								msg={props.msg}
								md={props.md}
								isEdited={props.isEdited}
								isEncrypted={props.isEncrypted}
								channels={props.channels}
								mentions={props.mentions}
								useRealName={props.useRealName}
								isIgnored={props.isIgnored}
								type={props.type}
								comment={props.comment}
								hasError={props.hasError}
								isHeader={props.isHeader}
								isTranslated={props.isTranslated}
								pinned={props.pinned}
								attachments={props.attachments}
								autoTranslateLanguage={props.autoTranslateLanguage}
								author={props.author}
								alias={props.alias}
								role={props.role}
							/>
							{props.isInfo && props.type === 'message_pinned' ? (
								<View pointerEvents='none'>
									<Attachments attachments={props.attachments} timeFormat={props.timeFormat} author={props.author} />
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
					<MessageAvatar isHeader={props.isHeader} avatar={props.avatar} emoji={props.emoji} author={props.author} />
					<View style={styles.messageContent}>
						<MessageInner
							id={props.id}
							rid={props.rid}
							msg={props.msg}
							md={props.md}
							type={props.type}
							attachments={props.attachments}
							blocks={props.blocks}
							urls={props.urls}
							reactions={props.reactions}
							alias={props.alias}
							avatar={props.avatar}
							emoji={props.emoji}
							timeFormat={props.timeFormat}
							archived={props.archived}
							broadcast={props.broadcast}
							useRealName={props.useRealName}
							isReadReceiptEnabled={props.isReadReceiptEnabled}
							unread={props.unread}
							role={props.role}
							drid={props.drid}
							dcount={props.dcount}
							dlm={props.dlm}
							tmid={props.tmid}
							tcount={props.tcount}
							tlm={props.tlm}
							tmsg={props.tmsg}
							mentions={props.mentions}
							channels={props.channels}
							isIgnored={props.isIgnored}
							isEdited={props.isEdited}
							isHeader={props.isHeader}
							isThreadReply={props.isThreadReply}
							isThreadSequential={props.isThreadSequential}
							isThreadRoom={props.isThreadRoom}
							isInfo={props.isInfo}
							isTemp={props.isTemp}
							isEncrypted={props.isEncrypted}
							hasError={props.hasError}
							highlighted={props.highlighted}
							comment={props.comment}
							isTranslated={props.isTranslated}
							isBeingEdited={props.isBeingEdited}
							isPreview={props.isPreview}
							pinned={props.pinned}
							autoTranslateLanguage={props.autoTranslateLanguage}
							author={props.author}
							ts={props.ts}
							small={props.small}
						/>
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

const MessageTouchable = memo((props: TMessageProps) => {
	const { onPress, onLongPress } = useContext(MessageContext);
	const { colors } = useTheme();
	const { ref: touchRef, markAsLastFocused } = useLastFocusedMessageRef();
	const accessibilityLabelValue = useMessageAccessibilityLabel(props);
	const isDisabled =
		(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp || props.type === 'jitsi_call_started';
	const accessibilityActions = useMessageAccessibilityActions(isDisabled);
	const accessibilityHint = useMessageAccessibilityHint(props);

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
				<Message
					id={props.id}
					rid={props.rid}
					msg={props.msg}
					md={props.md}
					type={props.type}
					attachments={props.attachments}
					blocks={props.blocks}
					urls={props.urls}
					reactions={props.reactions}
					alias={props.alias}
					avatar={props.avatar}
					emoji={props.emoji}
					timeFormat={props.timeFormat}
					archived={props.archived}
					broadcast={props.broadcast}
					useRealName={props.useRealName}
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					unread={props.unread}
					role={props.role}
					drid={props.drid}
					dcount={props.dcount}
					dlm={props.dlm}
					tmid={props.tmid}
					tcount={props.tcount}
					tlm={props.tlm}
					tmsg={props.tmsg}
					mentions={props.mentions}
					channels={props.channels}
					isIgnored={props.isIgnored}
					isEdited={props.isEdited}
					isHeader={props.isHeader}
					isThreadReply={props.isThreadReply}
					isThreadSequential={props.isThreadSequential}
					isThreadRoom={props.isThreadRoom}
					isInfo={props.isInfo}
					isTemp={props.isTemp}
					isEncrypted={props.isEncrypted}
					hasError={props.hasError}
					highlighted={props.highlighted}
					comment={props.comment}
					isTranslated={props.isTranslated}
					isBeingEdited={props.isBeingEdited}
					isPreview={props.isPreview}
					pinned={props.pinned}
					autoTranslateLanguage={props.autoTranslateLanguage}
					author={props.author}
					ts={props.ts}
					small={props.small}
				/>
			</A11y.Order>
		);
	}

	const handleLongPress = () => {
		markAsLastFocused();
		onLongPress?.();
	};

	return (
		<A11y.Order>
			<A11y.Index index={1}>
				<Touch
					componentRef={touchRef}
					onLongPress={handleLongPress}
					onPress={onPress}
					disabled={isDisabled}
					style={{ backgroundColor }}
					testID={props.isBeingEdited ? `message-editing-${props.id}` : undefined}
					accessible
					accessibilityRole='button'
					accessibilityLabel={accessibilityLabelValue}
					accessibilityHint={accessibilityHint}
					accessibilityActions={accessibilityActions}
					onAccessibilityAction={e => {
						if (e.nativeEvent.actionName === 'showActions') handleLongPress();
					}}>
					<Message
						id={props.id}
						rid={props.rid}
						msg={props.msg}
						md={props.md}
						type={props.type}
						attachments={props.attachments}
						blocks={props.blocks}
						urls={props.urls}
						reactions={props.reactions}
						alias={props.alias}
						avatar={props.avatar}
						emoji={props.emoji}
						timeFormat={props.timeFormat}
						archived={props.archived}
						broadcast={props.broadcast}
						useRealName={props.useRealName}
						isReadReceiptEnabled={props.isReadReceiptEnabled}
						unread={props.unread}
						role={props.role}
						drid={props.drid}
						dcount={props.dcount}
						dlm={props.dlm}
						tmid={props.tmid}
						tcount={props.tcount}
						tlm={props.tlm}
						tmsg={props.tmsg}
						mentions={props.mentions}
						channels={props.channels}
						isIgnored={props.isIgnored}
						isEdited={props.isEdited}
						isHeader={props.isHeader}
						isThreadReply={props.isThreadReply}
						isThreadSequential={props.isThreadSequential}
						isThreadRoom={props.isThreadRoom}
						isInfo={props.isInfo}
						isTemp={props.isTemp}
						isEncrypted={props.isEncrypted}
						hasError={props.hasError}
						highlighted={props.highlighted}
						comment={props.comment}
						isTranslated={props.isTranslated}
						isBeingEdited={props.isBeingEdited}
						isPreview={props.isPreview}
						pinned={props.pinned}
						autoTranslateLanguage={props.autoTranslateLanguage}
						author={props.author}
						ts={props.ts}
						small={props.small}
						handleLongPress={!isDisabled ? handleLongPress : undefined}
					/>
				</Touch>
			</A11y.Index>
		</A11y.Order>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
