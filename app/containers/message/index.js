import React from 'react';
import PropTypes from 'prop-types';
import { View, TouchableHighlight, Text, TouchableOpacity, Vibration, ViewPropTypes } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import equal from 'deep-equal';
import { KeyboardUtils } from 'react-native-keyboard-input';

import { actionsShow, errorActionsShow, toggleReactionPicker } from '../../actions/messages';
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
import messageStatus from '../../constants/messagesStatus';
import styles from './styles';

@connect(state => ({
	message: state.messages.message,
	editing: state.messages.editing,
	customEmojis: state.customEmojis
}), dispatch => ({
	actionsShow: actionMessage => dispatch(actionsShow(actionMessage)),
	errorActionsShow: actionMessage => dispatch(errorActionsShow(actionMessage)),
	toggleReactionPicker: message => dispatch(toggleReactionPicker(message))
}))
export default class Message extends React.Component {
	static propTypes = {
		status: PropTypes.any,
		item: PropTypes.object.isRequired,
		reactions: PropTypes.any.isRequired,
		baseUrl: PropTypes.string.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		message: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		editing: PropTypes.bool,
		errorActionsShow: PropTypes.func,
		customEmojis: PropTypes.object,
		toggleReactionPicker: PropTypes.func,
		onReactionPress: PropTypes.func,
		style: ViewPropTypes.style,
		onLongPress: PropTypes.func,
		_updatedAt: PropTypes.instanceOf(Date),
		archived: PropTypes.bool
	}

	static defaultProps = {
		onLongPress: () => {},
		_updatedAt: new Date(),
		archived: false
	}

	constructor(props) {
		super(props);
		this.state = { reactionsModal: false };
		this.onClose = this.onClose.bind(this);
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!equal(this.props.reactions, nextProps.reactions)) {
			return true;
		}
		if (this.state.reactionsModal !== nextState.reactionsModal) {
			return true;
		}
		return this.props._updatedAt.toGMTString() !== nextProps._updatedAt.toGMTString() || this.props.status !== nextProps.status;
	}

	onPress = () => {
		KeyboardUtils.dismiss();
	}

	onLongPress() {
		this.props.onLongPress(this.parseMessage());
	}

	onErrorPress() {
		this.props.errorActionsShow(this.parseMessage());
	}

	onReactionPress(emoji) {
		this.props.onReactionPress(emoji, this.props.item._id);
	}
	onClose() {
		this.setState({ reactionsModal: false });
	}
	onReactionLongPress() {
		this.setState({ reactionsModal: true });
		Vibration.vibrate(50);
	}

	getInfoMessage() {
		let message = '';
		const {
			t, role, msg, u
		} = this.props.item;

		if (t === 'rm') {
			message = 'Message removed';
		} else if (t === 'uj') {
			message = 'Has joined the channel.';
		} else if (t === 'r') {
			message = `Room name changed to: ${ msg } by ${ u.username }`;
		} else if (t === 'message_pinned') {
			message = 'Message pinned';
		} else if (t === 'ul') {
			message = 'Has left the channel.';
		} else if (t === 'ru') {
			message = `User ${ msg } removed by ${ u.username }`;
		} else if (t === 'au') {
			message = `User ${ msg } added by ${ u.username }`;
		} else if (t === 'user-muted') {
			message = `User ${ msg } muted by ${ u.username }`;
		} else if (t === 'user-unmuted') {
			message = `User ${ msg } unmuted by ${ u.username }`;
		} else if (t === 'subscription-role-added') {
			message = `${ msg } was set ${ role } by ${ u.username }`;
		} else if (t === 'subscription-role-removed') {
			message = `${ msg } is no longer ${ role } by ${ u.username }`;
		} else if (t === 'room_changed_description') {
			message = `Room description changed to: ${ msg } by ${ u.username }`;
		} else if (t === 'room_changed_announcement') {
			message = `Room announcement changed to: ${ msg } by ${ u.username }`;
		} else if (t === 'room_changed_topic') {
			message = `Room topic changed to: ${ msg } by ${ u.username }`;
		} else if (t === 'room_changed_privacy') {
			message = `Room type changed to: ${ msg } by ${ u.username }`;
		}

		return message;
	}

	parseMessage = () => JSON.parse(JSON.stringify(this.props.item));

	isInfoMessage() {
		return [
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
		].includes(this.props.item.t);
	}

	isDeleted() {
		return this.props.item.t === 'rm';
	}

	isTemp() {
		return this.props.item.status === messageStatus.TEMP || this.props.item.status === messageStatus.ERROR;
	}

	hasError() {
		return this.props.item.status === messageStatus.ERROR;
	}

	attachments() {
		if (this.props.item.attachments.length === 0) {
			return null;
		}

		const file = this.props.item.attachments[0];
		const { baseUrl, user } = this.props;
		if (file.image_type) {
			return <Image file={file} baseUrl={baseUrl} user={user} />;
		} else if (file.audio_type) {
			return <Audio file={file} baseUrl={baseUrl} user={user} />;
		} else if (file.video_type) {
			return <Video file={file} baseUrl={baseUrl} user={user} />;
		}

		return <Reply attachment={file} timeFormat={this.props.Message_TimeFormat} />;
	}

	renderMessageContent() {
		if (this.isInfoMessage()) {
			return <Text style={styles.textInfo}>{this.getInfoMessage()}</Text>;
		}
		const { item, customEmojis, baseUrl } = this.props;
		return <Markdown msg={item.msg} customEmojis={customEmojis} baseUrl={baseUrl} />;
	}

	renderUrl() {
		if (this.props.item.urls.length === 0) {
			return null;
		}

		return this.props.item.urls.map(url => (
			<Url url={url} key={url.url} />
		));
	}

	renderError = () => {
		if (!this.hasError()) {
			return null;
		}
		return (
			<TouchableOpacity onPress={() => this.onErrorPress()}>
				<Icon name='error-outline' color='red' size={20} style={{ padding: 10, paddingRight: 12, paddingLeft: 0 }} />
			</TouchableOpacity>
		);
	}

	renderReaction(reaction) {
		const reacted = reaction.usernames.findIndex(item => item.value === this.props.user.username) !== -1;
		const reactedContainerStyle = reacted ? { borderColor: '#bde1fe', backgroundColor: '#f3f9ff' } : {};
		const reactedCount = reacted ? { color: '#4fb0fc' } : {};
		return (
			<TouchableOpacity
				onPress={() => this.onReactionPress(reaction.emoji)}
				onLongPress={() => this.onReactionLongPress()}
				key={reaction.emoji}
			>
				<View style={[styles.reactionContainer, reactedContainerStyle]}>
					<Emoji
						content={reaction.emoji}
						standardEmojiStyle={styles.reactionEmoji}
						customEmojiStyle={styles.reactionCustomEmoji}
						customEmojis={this.props.customEmojis}
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
				{this.props.item.reactions.map(reaction => this.renderReaction(reaction))}
				<TouchableOpacity
					onPress={() => this.props.toggleReactionPicker(this.parseMessage())}
					key='add-reaction'
					style={styles.reactionContainer}
				>
					<Icon name='insert-emoticon' color='#aaaaaa' size={15} />
				</TouchableOpacity>
			</View>
		);
	}

	render() {
		const {
			item, message, editing, baseUrl, customEmojis, style, archived
		} = this.props;
		const username = item.alias || item.u.username;
		const isEditing = message._id === item._id && editing;
		const accessibilityLabel = `Message from ${ username } at ${ moment(item.ts).format(this.props.Message_TimeFormat) }, ${ this.props.item.msg }`;

		return (
			<TouchableHighlight
				onPress={() => this.onPress()}
				onLongPress={() => this.onLongPress()}
				disabled={this.isDeleted() || this.hasError() || archived}
				underlayColor='#FFFFFF'
				activeOpacity={0.3}
				style={[styles.message, isEditing ? styles.editing : null, style]}
				accessibilityLabel={accessibilityLabel}
			>
				<View style={styles.flex}>
					{this.renderError()}
					<View style={[this.isTemp() && { opacity: 0.3 }, styles.flex]}>
						<Avatar
							style={styles.avatar}
							text={item.avatar ? '' : username}
							size={40}
							baseUrl={baseUrl}
							avatar={item.avatar}
						/>
						<View style={[styles.content]}>
							<User
								onPress={this._onPress}
								item={item}
								Message_TimeFormat={this.props.Message_TimeFormat}
								baseUrl={baseUrl}
							/>
							{this.renderMessageContent()}
							{this.attachments()}
							{this.renderUrl()}
							{this.renderReactions()}
						</View>
					</View>
					{this.state.reactionsModal ?
						<ReactionsModal
							isVisible={this.state.reactionsModal}
							onClose={this.onClose}
							reactions={item.reactions}
							user={this.props.user}
							customEmojis={customEmojis}
						/>
						: null
					}
				</View>
			</TouchableHighlight>
		);
	}
}
