import React from 'react';
import PropTypes from 'prop-types';
import { Vibration, ViewPropTypes } from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import Message from './Message';
import { errorActionsShow, toggleReactionPicker, replyBroadcast } from '../../actions/messages';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	customEmojis: state.customEmojis,
	editing: state.messages.editing,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	message: state.messages.message,
	useRealName: state.settings.UI_Use_Real_Name
}), dispatch => ({
	errorActionsShow: actionMessage => dispatch(errorActionsShow(actionMessage)),
	replyBroadcast: message => dispatch(replyBroadcast(message)),
	toggleReactionPicker: message => dispatch(toggleReactionPicker(message))
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
		editing: PropTypes.bool,
		Message_GroupingPeriod: PropTypes.number,
		Message_TimeFormat: PropTypes.string,
		message: PropTypes.object,
		useRealName: PropTypes.bool,
		// methods - props
		onLongPress: PropTypes.func,
		onReactionPress: PropTypes.func,
		// methods - redux
		errorActionsShow: PropTypes.func,
		replyBroadcast: PropTypes.func,
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


	onReactionLongPress = () => {
		this.setState({ reactionsModal: true });
		Vibration.vibrate(50);
	}

	get timeFormat() {
		const { customTimeFormat, Message_TimeFormat } = this.props;
		return customTimeFormat || Message_TimeFormat;
	}

	closeReactions = () => {
		this.setState({ reactionsModal: false });
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
			item, message, editing, user, style, archived, baseUrl, customEmojis, useRealName, broadcast
		} = this.props;
		const {
			msg, ts, attachments, urls, reactions, t, status, avatar, u, alias, editedBy
		} = item;
		const isEditing = message._id === item._id && editing;
		return (
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
				reactionsModal={this.state.reactionsModal}
				useRealName={useRealName}
				closeReactions={this.closeReactions}
				onErrorPress={this.onErrorPress}
				onLongPress={this.onLongPress}
				onReactionLongPress={this.onReactionLongPress}
				onReactionPress={this.onReactionPress}
				replyBroadcast={this.replyBroadcast}
				toggleReactionPicker={this.toggleReactionPicker}
			/>
		);
	}
}
