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
import { actionsShow, errorActionsShow, toggleReactionPicker } from '../../actions/messages';
import messagesStatus from '../../constants/messagesStatus';
import Touch from '../../utils/touch';

const getInfoMessage = ({
	t, role, msg, u
}) => {
	if (t === 'rm') {
		return 'Message removed';
	} else if (t === 'uj') {
		return 'Has joined the channel.';
	} else if (t === 'r') {
		return `Room name changed to: ${ msg } by ${ u.username }`;
	} else if (t === 'message_pinned') {
		return 'Message pinned';
	} else if (t === 'ul') {
		return 'Has left the channel.';
	} else if (t === 'ru') {
		return `User ${ msg } removed by ${ u.username }`;
	} else if (t === 'au') {
		return `User ${ msg } added by ${ u.username }`;
	} else if (t === 'user-muted') {
		return `User ${ msg } muted by ${ u.username }`;
	} else if (t === 'user-unmuted') {
		return `User ${ msg } unmuted by ${ u.username }`;
	} else if (t === 'subscription-role-added') {
		return `${ msg } was set ${ role } by ${ u.username }`;
	} else if (t === 'subscription-role-removed') {
		return `${ msg } is no longer ${ role } by ${ u.username }`;
	} else if (t === 'room_changed_description') {
		return `Room description changed to: ${ msg } by ${ u.username }`;
	} else if (t === 'room_changed_announcement') {
		return `Room announcement changed to: ${ msg } by ${ u.username }`;
	} else if (t === 'room_changed_topic') {
		return `Room topic changed to: ${ msg } by ${ u.username }`;
	} else if (t === 'room_changed_privacy') {
		return `Room type changed to: ${ msg } by ${ u.username }`;
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
	toggleReactionPicker: message => dispatch(toggleReactionPicker(message))
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
		return this.props._updatedAt.toGMTString() !== nextProps._updatedAt.toGMTString();
	}

	onPress = () => {
		console.warn(this.props.previousItem)
		// KeyboardUtils.dismiss();
	}

	onLongPress() {
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
		return this.props.item.status === messagesStatus.TEMP || this.props.item.status === messagesStatus.ERROR;
	}

	hasError() {
		return this.props.item.status === messagesStatus.ERROR;
	}

	renderHeader = (username) => {
		const { item, previousItem } = this.props;
		let render = false;

		if (previousItem && (
			(previousItem.ts.toDateString() !== item.ts.toDateString()) ||
			(previousItem.groupable === false || item.groupable === false) ||
			(previousItem.u.username !== item.u.username) ||
			(item.ts - previousItem.ts > this.props.Message_GroupingPeriod * 1000)
		)) {
			render = true;
		}

		if (render) {
			return (
				<View style={[styles.flex, { marginBottom: 5 }]}>
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
		return null;
	}

	renderContent() {
		if (this.isInfoMessage()) {
			return <Text style={styles.textInfo}>{getInfoMessage(this.props.item)}</Text>;
		}
		const { item, customEmojis, baseUrl } = this.props;
		return <Markdown msg={item.msg} customEmojis={customEmojis} baseUrl={baseUrl} />;
	}

	renderAttachment() {
		if (this.props.item.attachments.length === 0) {
			return null;
		}

		const file = this.props.item.attachments[0];
		const { baseUrl, user } = this.props;
		if (file.image_type) {
			return <Image file={file} baseUrl={baseUrl} user={user} />;
		}
		if (file.audio_type) {
			return <Audio file={file} baseUrl={baseUrl} user={user} />;
		}
		if (file.video_type) {
			return <Video file={file} baseUrl={baseUrl} user={user} />;
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
				<Icon name='error-outline' color='red' size={20} style={{ padding: 10, paddingRight: 12, paddingLeft: 0 }} />
			</TouchableOpacity>
		);
	}

	renderReaction = (reaction) => {
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
				{this.props.item.reactions.map(this.renderReaction)}
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
			item, message, editing, customEmojis, style, archived
		} = this.props;
		const username = item.alias || item.u.username;
		const isEditing = message._id === item._id && editing;
		const accessibilityLabel = `Message from ${ username } at ${ moment(item.ts).format(this.timeFormat) }, ${ this.props.item.msg }`;

		return (
			<Touch
				onPress={() => this.onPress()}
				onLongPress={() => this.onLongPress()}
				disabled={this.isDeleted() || this.hasError() || archived}
				underlayColor='#FFFFFF'
				activeOpacity={0.3}
				style={[styles.message, isEditing ? styles.editing : null, style, styles.flex]}
				accessibilityLabel={accessibilityLabel}
			>
				<View style={{ flexDirection: 'column', flex: 1 }}>
					{this.renderHeader(username)}
					<View style={styles.flex}>
						{this.renderError()}
						<View style={[styles.flex, this.isTemp() && { opacity: 0.3 }, { marginLeft: 30 }]}>
							<View style={styles.content}>
								{this.renderContent()}
								{this.renderAttachment()}
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
				</View>
			</Touch>
		);
	}
}
