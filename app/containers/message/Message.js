import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';

import Touch from '../../utils/touch';

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

const MessageInner = React.memo((props) => {
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
	return (
		<>
			<User {...props} />
			<Content {...props} />
			<Attachments {...props} />
			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
			<Blocks {...props} />
		</>
	);
});
MessageInner.displayName = 'MessageInner';

const Message = React.memo((props) => {
	if (props.isThreadReply || props.isThreadSequential || props.isInfo) {
		const thread = props.isThreadReply ? <RepliedThread {...props} /> : null;
		return (
			<View style={[styles.container, props.style]}>
				{thread}
				<View style={[styles.flex, styles.center]}>
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

const MessageTouchable = React.memo((props) => {
	const longPress = ({ nativeEvent }) => {
		if (nativeEvent.state === State.ACTIVE) {
			props.onLongPress();
		}
	};

	if (props.hasError) {
		return (
			<View>
				<Message {...props} />
			</View>
		);
	}
	return (
		<LongPressGestureHandler
			onHandlerStateChange={longPress}
			minDurationMs={800}
		>
			<Touch
				onPress={props.onPress}
				enabled={!(props.isInfo || props.archived || props.isTemp)}
				theme={props.theme}
			>
				<View>
					<Message {...props} />
				</View>
			</Touch>
		</LongPressGestureHandler>
	);
});
MessageTouchable.displayName = 'MessageTouchable';

MessageTouchable.propTypes = {
	hasError: PropTypes.bool,
	isInfo: PropTypes.bool,
	isTemp: PropTypes.bool,
	archived: PropTypes.bool,
	onLongPress: PropTypes.func,
	onPress: PropTypes.func,
	theme: PropTypes.string
};

Message.propTypes = {
	isThreadReply: PropTypes.bool,
	isThreadSequential: PropTypes.bool,
	isInfo: PropTypes.bool,
	isTemp: PropTypes.bool,
	isHeader: PropTypes.bool,
	hasError: PropTypes.bool,
	style: PropTypes.any,
	onLongPress: PropTypes.func,
	onPress: PropTypes.func,
	isReadReceiptEnabled: PropTypes.bool,
	unread: PropTypes.bool,
	theme: PropTypes.string
};

MessageInner.propTypes = {
	type: PropTypes.string
};

export default MessageTouchable;
