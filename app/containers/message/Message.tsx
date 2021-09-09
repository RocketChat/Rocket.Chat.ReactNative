import React, { useContext } from 'react';
import { View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import MessageContext from './Context';
import User from './User';
import styles from './styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Attachments from './Attachments';
import Urls from './Urls';
import Thread from './Thread';
import Blocks from './Blocks';
import Reactions from './Reactions';
import Broadcast from './Broadcast';
import Discussion from './Discussion';
import Content from './Content';
import ReadReceipt from './ReadReceipt';
import CallButton from './CallButton';
import { themes } from '../../constants/colors';
import { IMessage, IMessageInner, IMessageTouchable } from './interfaces';

const MessageInner = React.memo((props: IMessageInner) => {
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

const Message = React.memo((props: IMessage) => {
	if (props.isThreadReply || props.isThreadSequential || props.isInfo || props.isIgnored) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		return (
			<View style={[styles.container, props.style]}>
				{thread}
				<View style={styles.flex}>
					{/* @ts-ignore */}
					<MessageAvatar small {...props} />
					<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
						<Content {...props} />
					</View>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, props.style]}>
			<View style={styles.flex}>
				{/* @ts-ignore */}
				<MessageAvatar {...props} />
				<View style={[styles.messageContent, props.isHeader && styles.messageContentWithHeader]}>
					<MessageInner {...props} />
				</View>
				<ReadReceipt isReadReceiptEnabled={props.isReadReceiptEnabled} unread={props.unread} theme={props.theme} />
			</View>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props: IMessageTouchable & IMessage) => {
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
			style={{ backgroundColor: props.highlighted ? themes[props.theme].headerBackground : null }}>
			<View>
				<Message {...props} />
			</View>
		</Touchable>
	);
});

MessageTouchable.displayName = 'MessageTouchable';

export default MessageTouchable;
