import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, Vibration, ViewPropTypes } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import equal from 'deep-equal';
import { KeyboardUtils } from 'react-native-keyboard-input';

import Image from './Image';
import User from './User';
import Avatar from '../Avatar';
import Audio from './Audio';
import Video from './Video';
import Markdown from './Markdown';
import Url from './Url';
import Reply from './Reply';
import ReactionsModal from './ReactionsModal';
import Emoji from './Emoji';
import styles from './styles';
import { actionsShow, errorActionsShow, toggleReactionPicker, replyBroadcast } from '../../actions/messages';
import messagesStatus from '../../constants/messagesStatus';
import Touch from '../../utils/touch';
import I18n from '../../i18n';

const SYSTEM_MESSAGES = [
	'r',
	'au',
	'ru',
	'ul',
	'uj',
	'rm',
	'user-muted',
	'user-unmuted',
	'message_pinned',
	'subscription-role-added',
	'subscription-role-removed',
	'room_changed_description',
	'room_changed_announcement',
	'room_changed_topic',
	'room_changed_privacy'
];

const getInfoMessage = ({
	t, role, msg, u
}) => {
	if (t === 'rm') {
		return I18n.t('Message_removed');
	} else if (t === 'uj') {
		return I18n.t('Has_joined_the_channel');
	} else if (t === 'r') {
		return I18n.t('Room_name_changed', { name: msg, userBy: u.username });
	} else if (t === 'message_pinned') {
		return I18n.t('Message_pinned');
	} else if (t === 'ul') {
		return I18n.t('Has_left_the_channel');
	} else if (t === 'ru') {
		return I18n.t('User_removed_by', { userRemoved: msg, userBy: u.username });
	} else if (t === 'au') {
		return I18n.t('User_added_by', { userAdded: msg, userBy: u.username });
	} else if (t === 'user-muted') {
		return I18n.t('User_muted_by', { userMuted: msg, userBy: u.username });
	} else if (t === 'user-unmuted') {
		return I18n.t('User_unmuted_by', { userUnmuted: msg, userBy: u.username });
	} else if (t === 'subscription-role-added') {
		return `${ msg } was set ${ role } by ${ u.username }`;
	} else if (t === 'subscription-role-removed') {
		return `${ msg } is no longer ${ role } by ${ u.username }`;
	} else if (t === 'room_changed_description') {
		return I18n.t('Room_changed_description', { description: msg, userBy: u.username });
	} else if (t === 'room_changed_announcement') {
		return I18n.t('Room_changed_announcement', { announcement: msg, userBy: u.username });
	} else if (t === 'room_changed_topic') {
		return I18n.t('Room_changed_topic', { topic: msg, userBy: u.username });
	} else if (t === 'room_changed_privacy') {
		return I18n.t('Room_changed_privacy', { type: msg, userBy: u.username });
	}
	return '';
};

@connect(state => ({
	message: state.messages.message,
	editing: state.messages.editing,
	customEmojis: state.customEmojis,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod
}), dispatch => ({
	actionsShow: actionMessage => dispatch(actionsShow(actionMessage)),
	errorActionsShow: actionMessage => dispatch(errorActionsShow(actionMessage)),
	toggleReactionPicker: message => dispatch(toggleReactionPicker(message)),
	replyBroadcast: message => dispatch(replyBroadcast(message))
}))
export default class Message extends React.Component {
	static propTypes = {
		status: PropTypes.any,
		item: PropTypes.object.isRequired,
		reactions: PropTypes.any.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		Message_GroupingPeriod: PropTypes.number.isRequired,
		customTimeFormat: PropTypes.string,
		message: PropTypes.object.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		editing: PropTypes.bool,
		errorActionsShow: PropTypes.func,
		toggleReactionPicker: PropTypes.func,
		replyBroadcast: PropTypes.func,
		onReactionPress: PropTypes.func,
		style: ViewPropTypes.style,
		onLongPress: PropTypes.func,
		_updatedAt: PropTypes.instanceOf(Date),
		archived: PropTypes.bool,
		broadcast: PropTypes.bool,
		previousItem: PropTypes.object
	}

	static defaultProps = {
		onLongPress: () => {},
		_updatedAt: new Date(),
		archived: false,
		broadcast: false
	}

	constructor(props) {
		super(props);
		this.state = { reactionsModal: false };
		this.onClose = this.onClose.bind(this);
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (this.state.reactionsModal !== nextState.reactionsModal) {
			return true;
		}
		if (this.props.status !== nextProps.status) {
			return true;
		}
		// eslint-disable-next-line
		if (!!this.props._updatedAt ^ !!nextProps._updatedAt) {
			return true;
		}
		if (!equal(this.props.reactions, nextProps.reactions)) {
			return true;
		}
		if (this.props.broadcast !== nextProps.broadcast) {
			return true;
		}
		return this.props._updatedAt.toGMTString() !== nextProps._updatedAt.toGMTString();
	}

	onPress = () => {
		KeyboardUtils.dismiss();
	}

	onLongPress = () => {
		this.props.onLongPress(this.parseMessage());
	}

	onErrorPress = () => {
		this.props.errorActionsShow(this.parseMessage());
	}

	onReactionPress = (emoji) => {
		this.props.onReactionPress(emoji, this.props.item._id);
	}
	onClose() {
		this.setState({ reactionsModal: false });
	}
	onReactionLongPress() {
		this.setState({ reactionsModal: true });
		Vibration.vibrate(50);
	}

	get timeFormat() {
		const { customTimeFormat, Message_TimeFormat } = this.props;
		return customTimeFormat || Message_TimeFormat;
	}

	parseMessage = () => JSON.parse(JSON.stringify(this.props.item));

	isInfoMessage() {
		return SYSTEM_MESSAGES.includes(this.props.item.t);
	}

	isOwn = () => this.props.item.u && this.props.item.u._id === this.props.user.id;

	isDeleted() {
		return this.props.item.t === 'rm';
	}

	isTemp() {
		return this.props.item.status === messagesStatus.TEMP || this.props.item.status === messagesStatus.ERROR;
	}

	hasError() {
		return this.props.item.status === messagesStatus.ERROR;
	}

	renderHeader = (username) => {
		const { item, previousItem } = this.props;

		if (previousItem && (
			(previousItem.ts.toDateString() === item.ts.toDateString()) &&
			(previousItem.u.username === item.u.username) &&
			!(previousItem.groupable === false || item.groupable === false || this.props.broadcast === true) &&
			(previousItem.status === item.status) &&
			(item.ts - previousItem.ts < this.props.Message_GroupingPeriod * 1000)
		)) {
			return null;
		}

		return (
			<View style={styles.flex}>
				<Avatar
					style={styles.avatar}
					text={item.avatar ? '' : username}
					size={20}
					avatar={item.avatar}
				/>
				<User
					onPress={this._onPress}
					item={item}
					Message_TimeFormat={this.timeFormat}
				/>
			</View>
		);
	}

	renderContent() {
		if (this.isInfoMessage()) {
			return <Text style={styles.textInfo}>{getInfoMessage(this.props.item)}</Text>;
		}
		const { item } = this.props;
		return <Markdown msg={item.msg} />;
	}

	renderAttachment() {
		if (this.props.item.attachments.length === 0) {
			return null;
		}

		const file = this.props.item.attachments[0];
		const { user } = this.props;
		if (file.image_url) {
			return <Image file={file} user={user} />;
		}
		if (file.audio_url) {
			return <Audio file={file} user={user} />;
		}
		if (file.video_url) {
			return <Video file={file} user={user} />;
		}

		return <Reply attachment={file} timeFormat={this.timeFormat} />;
	}

	renderUrl = () => {
		const { urls } = this.props.item;
		if (urls.length === 0) {
			return null;
		}

		return urls.map(url => (
			<Url url={url} key={url.url} />
		));
	};

	renderError = () => {
		if (!this.hasError()) {
			return null;
		}
		return (
			<TouchableOpacity onPress={this.onErrorPress}>
				<Icon name='error-outline' color='red' size={20} style={styles.errorIcon} />
			</TouchableOpacity>
		);
	}

	renderReaction = (reaction) => {
		const reacted = reaction.usernames.findIndex(item => item.value === this.props.user.username) !== -1;
		const reactedContainerStyle = reacted && styles.reactedContainer;
		const reactedCount = reacted && styles.reactedCountText;
		return (
			<TouchableOpacity
				onPress={() => this.onReactionPress(reaction.emoji)}
				onLongPress={() => this.onReactionLongPress()}
				key={reaction.emoji}
				testID={`message-reaction-${ reaction.emoji }`}
			>
				<View style={[styles.reactionContainer, reactedContainerStyle]}>
					<Emoji
						content={reaction.emoji}
						standardEmojiStyle={styles.reactionEmoji}
						customEmojiStyle={styles.reactionCustomEmoji}
					/>
					<Text style={[styles.reactionCount, reactedCount]}>{ reaction.usernames.length }</Text>
				</View>
			</TouchableOpacity>
		);
	}

	renderReactions() {
		if (this.props.item.reactions.length === 0) {
			return null;
		}
		return (
			<View style={styles.reactionsContainer}>
				{this.props.item.reactions.map(this.renderReaction)}
				<TouchableOpacity
					onPress={() => this.props.toggleReactionPicker(this.parseMessage())}
					key='message-add-reaction'
					testID='message-add-reaction'
					style={styles.reactionContainer}
				>
					<Icon name='insert-emoticon' color='#aaaaaa' size={15} />
				</TouchableOpacity>
			</View>
		);
	}

	renderBroadcastReply() {
		if (!this.props.broadcast || this.isOwn()) {
			return null;
		}
		return (
			<TouchableOpacity
				style={styles.broadcastButton}
				onPress={() => this.props.replyBroadcast(this.parseMessage())}
			>
				<Text style={styles.broadcastButtonText}>Reply</Text>
			</TouchableOpacity>
		);
	}

	render() {
		const {
			item, message, editing, style, archived
		} = this.props;
		const username = item.alias || item.u.username;
		const isEditing = message._id === item._id && editing;
		const accessibilityLabel = I18n.t('Message_accessibility', { user: username, time: moment(item.ts).format(this.timeFormat), message: this.props.item.msg });

		return (
			<Touch
				onPress={this.onPress}
				onLongPress={this.onLongPress}
				disabled={this.isInfoMessage() || this.hasError() || archived}
				underlayColor='#FFFFFF'
				activeOpacity={0.3}
				accessibilityLabel={accessibilityLabel}
			>
				<View style={[styles.message, isEditing && styles.editing, style]}>
					{this.renderHeader(username)}
					<View style={styles.flex}>
						{this.renderError()}
						<View style={[styles.messageContent, this.isTemp() && styles.temp]}>
							{this.renderContent()}
							{this.renderAttachment()}
							{this.renderUrl()}
							{this.renderReactions()}
							{this.renderBroadcastReply()}
						</View>
					</View>
					{this.state.reactionsModal ?
						<ReactionsModal
							isVisible={this.state.reactionsModal}
							onClose={this.onClose}
							reactions={item.reactions}
							user={this.props.user}
						/>
						: null
					}
				</View>
			</Touch>
		);
	}
}
