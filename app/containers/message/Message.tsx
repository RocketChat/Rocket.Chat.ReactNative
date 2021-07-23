import React, { useContext } from 'react';
import { View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import MessageContext from './Context';

import User from './User';
import styles from './styles';
import RepliedThread, {IMessageRepliedThread} from './RepliedThread';
import MessageAvatar, {IMessageAvatar} from './MessageAvatar';
import Attachments, {IMessageAttachments} from './Attachments';
import Urls from './Urls';
import Thread, {IMessageThread} from './Thread';
import Blocks, {IMessageBlocks} from './Blocks';
import Reactions from './Reactions';
import Broadcast, {IMessageBroadcast} from './Broadcast';
import Discussion, {IMessageDiscussion} from './Discussion';
import Content, {IMessageContent} from './Content';
import ReadReceipt from './ReadReceipt';
import CallButton, {IMessageCallButton} from './CallButton';
import { themes } from '../../constants/colors';


type TMessageInner = {
	type: string;
	blocks: [];
} & IMessageDiscussion & IMessageContent & IMessageCallButton & IMessageBlocks
	& IMessageThread & IMessageAttachments & IMessageBroadcast;

type TMessage = {
	isThreadReply: boolean;
	isThreadSequential: boolean;
	isInfo: boolean;
	isTemp: boolean;
	isHeader: boolean;
	hasError: boolean;
	style: any;
	onLongPress: Function;
	isReadReceiptEnabled: boolean;
	unread: boolean;
	theme: string;
	isIgnored: boolean;
} & IMessageRepliedThread & IMessageAvatar & IMessageContent & TMessageInner;

interface IMessageTouchable {
	hasError: boolean;
	isInfo: boolean;
	isThreadReply: boolean;
	isTemp: boolean;
	archived: boolean;
	highlighted: boolean;
	theme: string;
	ts?: any
	urls?: any;
	reactions?: any;
	alias?: any;
	role?: any;
	drid?: any;
}

const MessageInner = React.memo((props: TMessageInner) => {
	if (props.type === 'discussion-created') {
		return (
			<>
				<User {...props} />
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
			</>
		);
	}
	return (
		<>
			<User {...props} />
			<Content {...props} />
			<Attachments {...props} />
			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
		</>
	);
});
MessageInner.displayName = 'MessageInner';

const Message = React.memo((props: TMessage) => {
	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		return (
			<View style={[styles.container, props.style]}>
				{thread}
				<View style={styles.flex}>
					<MessageAvatar small {...props} />
					<View
						style={[
							styles.messageContent,
							props.isHeader && styles.messageContentWithHeader
						]}
					>
						<Content {...props} />
					</View>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, props.style]}>
			<View style={styles.flex}>
				<MessageAvatar {...props} />
				<View
					style={[
						styles.messageContent,
						props.isHeader && styles.messageContentWithHeader
					]}
				>
					<MessageInner {...props} />
				</View>
				<ReadReceipt
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					unread={props.unread}
					theme={props.theme}
				/>
			</View>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props: IMessageTouchable & TMessage) => {
	if (props.hasError) {
		return (
			<View>
				<Message {...props} />
			</View>
		);
	}
	const { onPress, onLongPress } = useContext(MessageContext);
	return (
		<Touchable
			onLongPress={onLongPress}
			onPress={onPress}
			disabled={(props.isInfo && !props.isThreadReply) || props.archived || props.isTemp}
			style={{ backgroundColor: props.highlighted ? themes[props.theme].headerBackground : null }}
		>
			<View>
				<Message {...props} />
			</View>
		</Touchable>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
