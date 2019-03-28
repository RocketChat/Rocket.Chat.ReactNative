import React from 'react';
import PropTypes from 'prop-types';
import { Text, Animated, ViewPropTypes } from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { CustomIcon } from '../../lib/Icons';

import Message from './Message';
import {
	errorActionsShow as errorActionsShowAction,
	toggleReactionPicker as toggleReactionPickerAction,
	replyBroadcast as replyBroadcastAction,
	replyInit as replyInitAction
} from '../../actions/messages';
import styles from './styles';
import { vibrate } from '../../utils/vibration';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	customEmojis: state.customEmojis,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	editingMessage: state.messages.message,
	useRealName: state.settings.UI_Use_Real_Name
}), dispatch => ({
	errorActionsShow: actionMessage => dispatch(errorActionsShowAction(actionMessage)),
	replyBroadcast: message => dispatch(replyBroadcastAction(message)),
	toggleReactionPicker: message => dispatch(toggleReactionPickerAction(message)),
	replyInit: (message, mention) => dispatch(replyInitAction(message, mention))
}))
export default class MessageContainer extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		reactions: PropTypes.any.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		customTimeFormat: PropTypes.string,
		style: ViewPropTypes.style,
		status: PropTypes.number,
		archived: PropTypes.bool,
		broadcast: PropTypes.bool,
		previousItem: PropTypes.object,
		_updatedAt: PropTypes.instanceOf(Date),
		// redux
		baseUrl: PropTypes.string,
		customEmojis: PropTypes.object,
		Message_GroupingPeriod: PropTypes.number,
		Message_TimeFormat: PropTypes.string,
		editingMessage: PropTypes.object,
		useRealName: PropTypes.bool,
		// methods - props
		onLongPress: PropTypes.func,
		onReactionPress: PropTypes.func,
		// methods - redux
		errorActionsShow: PropTypes.func,
		replyBroadcast: PropTypes.func,
		replyInit: PropTypes.func.isRequired,
		toggleReactionPicker: PropTypes.func
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
		this.closeReactions = this.closeReactions.bind(this);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { reactionsModal } = this.state;
		const {
			status, reactions, broadcast, _updatedAt, editingMessage, item
		} = this.props;

		if (reactionsModal !== nextState.reactionsModal) {
			return true;
		}
		if (status !== nextProps.status) {
			return true;
		}
		// eslint-disable-next-line
		if (!!_updatedAt ^ !!nextProps._updatedAt) {
			return true;
		}
		if (!equal(reactions, nextProps.reactions)) {
			return true;
		}
		if (broadcast !== nextProps.broadcast) {
			return true;
		}
		if (!equal(editingMessage, nextProps.editingMessage)) {
			if (nextProps.editingMessage && nextProps.editingMessage._id === item._id) {
				return true;
			} else if (!nextProps.editingMessage._id !== item._id && editingMessage._id === item._id) {
				return true;
			}
		}
		return _updatedAt.toGMTString() !== nextProps._updatedAt.toGMTString();
	}


	onLongPress = () => {
		const { onLongPress } = this.props;
		onLongPress(this.parseMessage());
	}

	onErrorPress = () => {
		const { errorActionsShow } = this.props;
		errorActionsShow(this.parseMessage());
	}

	onReactionPress = (emoji) => {
		const { onReactionPress, item } = this.props;
		onReactionPress(emoji, item._id);
	}


	onReactionLongPress = () => {
		this.setState({ reactionsModal: true });
		vibrate();
	}

	get timeFormat() {
		const { customTimeFormat, Message_TimeFormat } = this.props;
		return customTimeFormat || Message_TimeFormat;
	}

	closeReactions = () => {
		this.setState({ reactionsModal: false });
	}

	closeSwipeReply = () => {
		this.swipeableRow.close();
	};

	isHeader = () => {
		const {
			item, previousItem, broadcast, Message_GroupingPeriod
		} = this.props;
		if (previousItem && (
			(previousItem.ts.toDateString() === item.ts.toDateString())
			&& (previousItem.u.username === item.u.username)
			&& !(previousItem.groupable === false || item.groupable === false || broadcast === true)
			&& (item.ts - previousItem.ts < Message_GroupingPeriod * 1000)
		)) {
			return false;
		}
		return true;
	}

	handleReply = () => {
		const { item, replyInit } = this.props;
		replyInit(item, true);
		this.closeSwipeReply();
	}

	parseMessage = () => {
		const { item } = this.props;
		return JSON.parse(JSON.stringify(item));
	}

	toggleReactionPicker = () => {
		const { toggleReactionPicker } = this.props;
		toggleReactionPicker(this.parseMessage());
	}

	replyBroadcast = () => {
		const { replyBroadcast } = this.props;
		replyBroadcast(this.parseMessage());
	}

	renderLeftActions = (progress, dragX) => {
		const trans = dragX.interpolate({
			inputRange: [0, 50, 51],
			outputRange: [-50, 0, 1]
		});
		return (
			<Animated.View
				style={{ transform: [{ translateX: trans }], width: 50 }}
			>
				<RectButton style={styles.replyAction}>
					<CustomIcon size={13} name='reply' color='black' />
					<Text>Reply</Text>
				</RectButton>
			</Animated.View>
		);
	};

	render() {
		const { reactionsModal } = this.state;
		const {
			item, editingMessage, user, style, archived, baseUrl, customEmojis, useRealName, broadcast
		} = this.props;
		const {
			msg, ts, attachments, urls, reactions, t, status, avatar, u, alias, editedBy, role
		} = item;
		const isEditing = editingMessage._id === item._id;
		return (
			<Swipeable
				ref={ref => this.swipeableRow = ref}
				friction={2}
				leftThreshold={40}
				renderLeftActions={this.renderLeftActions}
				onSwipeableLeftOpen={this.handleReply}
			>
				<Message
					msg={msg}
					author={u}
					ts={ts}
					type={t}
					status={status}
					attachments={attachments}
					urls={urls}
					reactions={reactions}
					alias={alias}
					editing={isEditing}
					header={this.isHeader()}
					avatar={avatar}
					user={user}
					edited={editedBy && !!editedBy.username}
					timeFormat={this.timeFormat}
					style={style}
					archived={archived}
					broadcast={broadcast}
					baseUrl={baseUrl}
					customEmojis={customEmojis}
					reactionsModal={reactionsModal}
					useRealName={useRealName}
					role={role}
					closeReactions={this.closeReactions}
					onErrorPress={this.onErrorPress}
					onLongPress={this.onLongPress}
					onReactionLongPress={this.onReactionLongPress}
					onReactionPress={this.onReactionPress}
					replyBroadcast={this.replyBroadcast}
					toggleReactionPicker={this.toggleReactionPicker}
				/>
			</Swipeable>
		);
	}
}
