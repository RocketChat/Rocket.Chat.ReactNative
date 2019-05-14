import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import User from './User';
import MessageError from './MessageError';
import styles from './styles';
import sharedStyles from '../../views/Styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Attachments from './Attachments';
import Urls from './Urls';
import Thread from './Thread';
import Reactions from './Reactions';
import Broadcast from './Broadcast';
import Discussion from './Discussion';
import Content from './Content';

const MessageInner = React.memo((props) => {
	if (props.type === 'discussion-created') {
		return (
			<React.Fragment>
				<User {...props} />
				<Discussion {...props} />
			</React.Fragment>
		);
	}
	return (
		<React.Fragment>
			<User {...props} />
			<Content {...props} />
			<Attachments {...props} />
			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
		</React.Fragment>
	);
});
MessageInner.displayName = 'MessageInner';

const Message = React.memo((props) => {
	if (props.isThreadReply || props.isThreadSequential || props.isInfo) {
		const thread = props.isThreadReply ? <RepliedThread isTemp={props.isTemp} {...props} /> : null;
		return (
			<View style={[styles.container, props.style, props.isTemp && styles.temp]}>
				{thread}
				<View style={[styles.flex, sharedStyles.alignItemsCenter]}>
					<MessageAvatar small {...props} />
					<View
						style={[
							styles.messageContent,
							props.isHeader && styles.messageContentWithHeader,
							props.hasError && props.isHeader && styles.messageContentWithHeader,
							props.hasError && !props.isHeader && styles.messageContentWithError
						]}
					>
						<Content {...props} />
					</View>
				</View>
			</View>
		);
	}
	return (
		<View style={[styles.container, props.style, props.isTemp && styles.temp]}>
			<View style={styles.flex}>
				<MessageAvatar {...props} />
				<View
					style={[
						styles.messageContent,
						props.isHeader && styles.messageContentWithHeader,
						props.hasError && props.isHeader && styles.messageContentWithHeader,
						props.hasError && !props.isHeader && styles.messageContentWithError
					]}
				>
					<MessageInner {...props} />
				</View>
			</View>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props) => {
	if (props.hasError) {
		return (
			<View style={styles.root}>
				<MessageError {...props} />
				<Message {...props} />
			</View>
		);
	}
	return (
		<Touchable
			onLongPress={props.onLongPress}
			onPress={props.onPress}
			disabled={props.isInfo || props.archived || props.isTemp}
		>
			<View>
				<Message {...props} />
			</View>
		</Touchable>
	);
});
MessageTouchable.displayName = 'MessageTouchable';

MessageTouchable.propTypes = {
	hasError: PropTypes.bool,
	isInfo: PropTypes.bool,
	isTemp: PropTypes.bool,
	archived: PropTypes.bool,
	onLongPress: PropTypes.func,
	onPress: PropTypes.func
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
	onPress: PropTypes.func
};

MessageInner.propTypes = {
	type: PropTypes.string
};

export default MessageTouchable;
