import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, ViewPropTypes, TouchableWithoutFeedback
} from 'react-native';
import moment from 'moment';
import { KeyboardUtils } from 'react-native-keyboard-input';
import Touchable from 'react-native-platform-touchable';
import { emojify } from 'react-emojione';
import removeMarkdown from 'remove-markdown';

import Image from './Image';
import User from './User';
import Avatar from '../Avatar';
import Audio from './Audio';
import Video from './Video';
import Markdown from './Markdown';
// import Url from './Urls';
import Reply from './Reply';
import ReactionsModal from './ReactionsModal';
import MessageError from './MessageError';
import Emoji from './Emoji';
import styles from './styles';
import I18n from '../../i18n';
import messagesStatus from '../../constants/messagesStatus';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_DANGER } from '../../constants/colors';
import debounce from '../../utils/debounce';
import DisclosureIndicator from '../DisclosureIndicator';
import sharedStyles from '../../views/Styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Attachments from './Attachments';
import Urls from './Urls';
import Thread from './Thread';
import Reactions from './Reactions';
import Broadcast from './Broadcast';
import Discussion from './Discussion';

const SYSTEM_MESSAGES = [
	'r',
	'au',
	'ru',
	'ul',
	'uj',
	'ut',
	'rm',
	'user-muted',
	'user-unmuted',
	'message_pinned',
	'subscription-role-added',
	'subscription-role-removed',
	'room_changed_description',
	'room_changed_announcement',
	'room_changed_topic',
	'room_changed_privacy',
	'message_snippeted',
	'thread-created'
];

const getInfoMessage = ({
	type, role, msg, author
}) => {
	const { username } = author;
	if (type === 'rm') {
		return I18n.t('Message_removed');
	} else if (type === 'uj') {
		return I18n.t('Has_joined_the_channel');
	} else if (type === 'ut') {
		return I18n.t('Has_joined_the_conversation');
	} else if (type === 'r') {
		return I18n.t('Room_name_changed', { name: msg, userBy: username });
	} else if (type === 'message_pinned') {
		return I18n.t('Message_pinned');
	} else if (type === 'ul') {
		return I18n.t('Has_left_the_channel');
	} else if (type === 'ru') {
		return I18n.t('User_removed_by', { userRemoved: msg, userBy: username });
	} else if (type === 'au') {
		return I18n.t('User_added_by', { userAdded: msg, userBy: username });
	} else if (type === 'user-muted') {
		return I18n.t('User_muted_by', { userMuted: msg, userBy: username });
	} else if (type === 'user-unmuted') {
		return I18n.t('User_unmuted_by', { userUnmuted: msg, userBy: username });
	} else if (type === 'subscription-role-added') {
		return `${ msg } was set ${ role } by ${ username }`;
	} else if (type === 'subscription-role-removed') {
		return `${ msg } is no longer ${ role } by ${ username }`;
	} else if (type === 'room_changed_description') {
		return I18n.t('Room_changed_description', { description: msg, userBy: username });
	} else if (type === 'room_changed_announcement') {
		return I18n.t('Room_changed_announcement', { announcement: msg, userBy: username });
	} else if (type === 'room_changed_topic') {
		return I18n.t('Room_changed_topic', { topic: msg, userBy: username });
	} else if (type === 'room_changed_privacy') {
		return I18n.t('Room_changed_privacy', { type: msg, userBy: username });
	} else if (type === 'message_snippeted') {
		return I18n.t('Created_snippet');
	}
	return '';
};

const isInfoMessageFunc = ({ type }) => SYSTEM_MESSAGES.includes(type);

const isTempFunc = ({ status }) => status === messagesStatus.TEMP || status === messagesStatus.ERROR;

const hasErrorFunc = ({ status }) => status === messagesStatus.ERROR;

const onPress = debounce(({ onThreadPress, tlm, tmid }) => {
	KeyboardUtils.dismiss();

	if ((tlm || tmid) && onThreadPress) {
		onThreadPress();
	}
}, 300, true);

const onLongPress = ({
	archived, onLongPress: onLongPressProp, type, status
}) => {
	if (isInfoMessageFunc({ type }) || hasErrorFunc({ status }) || archived) {
		return;
	}
	onLongPressProp();
};

const RenderContent = React.memo((props) => {
	if (isInfoMessageFunc({ type: props.type })) {
		return <Text style={styles.textInfo}>{getInfoMessage({ ...props })}</Text>;
	}

	if (props.tmid && !props.msg) {
		return <Text style={styles.text}>{I18n.t('Sent_an_attachment')}</Text>;
	}

	return <Text>{props.msg}</Text>;
	// return (
	// 	<Markdown
	// 		msg={msg}
	// 		customEmojis={customEmojis}
	// 		baseUrl={baseUrl}
	// 		username={user.username}
	// 		edited={edited}
	// 		numberOfLines={tmid ? 1 : 0}
	// 	/>
	// );
});

const RenderInner = React.memo((props) => {
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
			<RenderContent {...props} />
			<Attachments {...props} />
			<Urls {...props} />
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
		</React.Fragment>
	);
});

const RenderMessage = React.memo((props) => {
	if (props.isThreadReply || props.isThreadSequential || isInfoMessageFunc({ type: props.type })) {
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
						<RenderContent {...props} />
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
				<RenderInner isTemp={props.isTemp} {...props} />
			</View>
		</View>
	);
});

const Message = React.memo((props) => {
	const accessibilityLabel = I18n.t('Message_accessibility', {
		user: props.author.username, 
		time: moment(props.ts).format(props.timeFormat), 
		message: props.msg
	});

	const hasError = hasErrorFunc({ status: props.status });
	const isTemp = isTempFunc({ status: props.status });

	return (
		<View style={styles.root}>
			<MessageError hasError={hasError} {...props} />
			<TouchableWithoutFeedback
				onLongPress={() => onLongPress(props)}
				onPress={() => onPress(props)}
			>
				<View
					style={[styles.container, props.editing && styles.editing, props.style]}
					accessibilityLabel={accessibilityLabel}
				>
					<RenderMessage isTemp={isTemp} hasError={hasError} {...props} />
				</View>
			</TouchableWithoutFeedback>
		</View>
	);
});

export default Message;
