import React from 'react';
import PropTypes from 'prop-types';
import { View, TouchableWithoutFeedback } from 'react-native';
import moment from 'moment';

import User from './User';
import MessageError from './MessageError';
import styles from './styles';
import I18n from '../../i18n';
// import debounce from '../../utils/debounce';
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
				<User isTemp={props.isTemp} {...props} />
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

const Message = React.memo((props) => {
	if (props.isThreadReply || props.isThreadSequential || props.isInfo) {
		const thread = props.isThreadReply ? <RepliedThread isTemp={props.isTemp} {...props} /> : null;
		return (
			<React.Fragment>
				{thread}
				<View style={[styles.flex, sharedStyles.alignItemsCenter]}>
					<MessageAvatar small {...props} />
					<View
						style={[
							styles.messageContent,
							props.header && styles.messageContentWithHeader,
							props.hasError && props.header && styles.messageContentWithHeader,
							props.hasError && !props.header && styles.messageContentWithError,
							props.isTemp && styles.temp
						]}
					>
						<Content {...props} />
					</View>
				</View>
			</React.Fragment>
		);
	}
	return (
		<View style={styles.flex}>
			<MessageAvatar {...props} />
			<View
				style={[
					styles.messageContent,
					props.header && styles.messageContentWithHeader,
					props.hasError && props.header && styles.messageContentWithHeader,
					props.hasError && !props.header && styles.messageContentWithError,
					props.isTemp && styles.temp
				]}
			>
				<MessageInner isTemp={props.isTemp} {...props} />
			</View>
		</View>
	);
});

const MessageTouchable = React.memo((props) => {
	const accessibilityLabel = I18n.t('Message_accessibility', {
		user: props.author.username, 
		time: moment(props.ts).format(props.timeFormat), 
		message: props.msg
	});

	return (
		<View style={styles.root}>
			<MessageError hasError={props.hasError} {...props} />
			<TouchableWithoutFeedback
				onLongPress={props.onLongPress}
				onPress={props.onPress}
			>
				<View
					style={[styles.container, props.editing && styles.editing, props.style]}
					accessibilityLabel={accessibilityLabel}
				>
					<Message isTemp={props.isTemp} hasError={props.hasError} {...props} />
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
});

export default MessageTouchable;
