import React from 'react';
import PropTypes from 'prop-types';
import { Vibration, ViewPropTypes } from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import Message from './Message';
import { actionsShow, errorActionsShow, toggleReactionPicker, replyBroadcast } from '../../actions/messages';

@connect(state => ({
	message: state.messages.message,
	editing: state.messages.editing,
	customEmojis: state.customEmojis,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}), dispatch => ({
	actionsShow: actionMessage => dispatch(actionsShow(actionMessage)),
	errorActionsShow: actionMessage => dispatch(errorActionsShow(actionMessage)),
	toggleReactionPicker: message => dispatch(toggleReactionPicker(message)),
	replyBroadcast: message => dispatch(replyBroadcast(message))
}))
export default class MessageContainer extends React.Component {
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
		previousItem: PropTypes.object,
		baseUrl: PropTypes.string,
		customEmojis: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object
		])
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
		if (this.props.editing !== nextProps.editing) {
			return true;
		}
		return this.props._updatedAt.toGMTString() !== nextProps._updatedAt.toGMTString();
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

	onClose = () => {
		this.setState({ reactionsModal: false });
	}

	onReactionLongPress = () => {
		this.setState({ reactionsModal: true });
		Vibration.vibrate(50);
	}

	get timeFormat() {
		const { customTimeFormat, Message_TimeFormat } = this.props;
		return customTimeFormat || Message_TimeFormat;
	}

	isHeader = () => {
		const { item, previousItem } = this.props;
		if (previousItem && (
			(previousItem.ts.toDateString() === item.ts.toDateString()) &&
			(previousItem.u.username === item.u.username) &&
			!(previousItem.groupable === false || item.groupable === false || this.props.broadcast === true) &&
			(previousItem.status === item.status) &&
			(item.ts - previousItem.ts < this.props.Message_GroupingPeriod * 1000)
		)) {
			return false;
		}
		return true;
	}

	parseMessage = () => JSON.parse(JSON.stringify(this.props.item));

	toggleReactionPicker = () => {
		this.props.toggleReactionPicker(this.parseMessage());
	}

	replyBroadcast = () => {
		this.props.replyBroadcast(this.parseMessage());
	}

	render() {
		const {
			item, message, editing, user, style, archived, baseUrl, customEmojis
		} = this.props;
		const {
			msg, ts, attachments, urls, reactions, t, status, avatar, u, alias, editedBy
		} = item;
		const isEditing = message._id === item._id && editing;
		return (
			<Message
				msg={msg}
				ts={ts}
				type={t}
				status={status}
				attachments={attachments}
				urls={urls}
				reactions={reactions}
				userId={u && u._id}
				username={u.username}
				alias={alias}
				editing={isEditing}
				header={this.isHeader()}
				avatar={avatar}
				loggedUser={user}
				edited={editedBy && !!editedBy.username}
				timeFormat={this.timeFormat}
				onClose={this.onClose}
				onErrorPress={this.onErrorPress}
				onLongPress={this.onLongPress}
				onPress={this.onPress}
				onReactionLongPress={this.onReactionLongPress}
				onReactionPress={this.onReactionPress}
				toggleReactionPicker={this.toggleReactionPicker}
				replyBroadcast={this.replyBroadcast}
				style={style}
				archived={archived}
				baseUrl={baseUrl}
				customEmojis={customEmojis}
				reactionsModal={this.state.reactionsModal}
			/>
		);
	}
}
