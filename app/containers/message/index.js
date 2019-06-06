import React from 'react';
import PropTypes from 'prop-types';
import { KeyboardUtils } from 'react-native-keyboard-input';

import Message from './Message';
import debounce from '../../utils/debounce';
import { SYSTEM_MESSAGES, getCustomEmoji } from './utils';
import messagesStatus from '../../constants/messagesStatus';

export default class MessageContainer extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		timeFormat: PropTypes.string,
		customThreadTimeFormat: PropTypes.string,
		style: PropTypes.any,
		archived: PropTypes.bool,
		broadcast: PropTypes.bool,
		previousItem: PropTypes.object,
		_updatedAt: PropTypes.instanceOf(Date),
		baseUrl: PropTypes.string,
		Message_GroupingPeriod: PropTypes.number,
		useRealName: PropTypes.bool,
		useMarkdown: PropTypes.bool,
		status: PropTypes.number,
		onLongPress: PropTypes.func,
		onReactionPress: PropTypes.func,
		navigation: PropTypes.func,
		errorActionsShow: PropTypes.func,
		replyBroadcast: PropTypes.func,
		toggleReactionPicker: PropTypes.func,
		onDiscussionPress: PropTypes.func,
		fetchThreadName: PropTypes.func,
		onThreadPress: PropTypes.func,
		onOpenFileModal: PropTypes.func,
		onReactionLongPress: PropTypes.func,
		customEmojis: PropTypes.array
	}

	static defaultProps = {
		onLongPress: () => {},
		_updatedAt: new Date(),
		archived: false,
		broadcast: false
	};

	shouldComponentUpdate(nextProps) {
		const {
			status, item, _updatedAt
		} = this.props;

		if (status !== nextProps.status) {
			return true;
		}
		if (item.tmsg !== nextProps.item.tmsg) {
			return true;
		}

		return _updatedAt.toISOString() !== nextProps._updatedAt.toISOString();
	}

	onPress = debounce(() => {
		const { item } = this.props;
		KeyboardUtils.dismiss();

		if ((item.tlm || item.tmid)) {
			this.onThreadPress();
		}
	}, 300, true);

	onLongPress = () => {
		const { archived, onLongPress } = this.props;
		if (this.isInfo || this.hasError || archived) {
			return;
		}
		if (onLongPress) {
			onLongPress(this.parseMessage());
		}
	};

	onErrorPress = () => {
		const { errorActionsShow } = this.props;
		if (errorActionsShow) {
			errorActionsShow(this.parseMessage());
		}
	}

		onReactionPress = (emoji) => {
			const { onReactionPress, item } = this.props;
			if (onReactionPress) {
				onReactionPress(emoji, item._id);
			}
		}

		onReactionLongPress = () => {
			const { onReactionLongPress, item } = this.props;
			if (onReactionLongPress) {
				onReactionLongPress(item);
			}
		}

	onDiscussionPress = () => {
		const { onDiscussionPress, item } = this.props;
		if (onDiscussionPress) {
			onDiscussionPress(item);
		}
	}

	onThreadPress = () => {
		const { onThreadPress, item } = this.props;
		if (onThreadPress) {
			onThreadPress(item);
		}
	}

	get isHeader() {
		const {
			item, previousItem, broadcast, Message_GroupingPeriod
		} = this.props;
		if (previousItem && (
			(previousItem.ts.toDateString() === item.ts.toDateString())
			&& (previousItem.u.username === item.u.username)
			&& !(previousItem.groupable === false || item.groupable === false || broadcast === true)
			&& (item.ts - previousItem.ts < Message_GroupingPeriod * 1000)
			&& (previousItem.tmid === item.tmid)
		)) {
			return false;
		}
		return true;
	}

	get isThreadReply() {
		const {
			item, previousItem
		} = this.props;
		if (previousItem && item.tmid && (previousItem.tmid !== item.tmid) && (previousItem._id !== item.tmid)) {
			return true;
		}
		return false;
	}

	get isThreadSequential() {
		const {
			item, previousItem
		} = this.props;
		if (previousItem && item.tmid && ((previousItem.tmid === item.tmid) || (previousItem._id === item.tmid))) {
			return true;
		}
		return false;
	}

	get isInfo() {
		const { item } = this.props;
		return SYSTEM_MESSAGES.includes(item.t);
	}

	get isTemp() {
		const { item } = this.props;
		return item.status === messagesStatus.TEMP || item.status === messagesStatus.ERROR;
	}

	get hasError() {
		const { item } = this.props;
		return item.status === messagesStatus.ERROR;
	}

	parseMessage = () => {
		const { item } = this.props;
		return JSON.parse(JSON.stringify(item));
	};

		replyBroadcast = () => {
			const { replyBroadcast } = this.props;
			if (replyBroadcast) {
				replyBroadcast(this.parseMessage());
			}
		};

	openReactionPicker = () => {
		const { toggleReactionPicker, navigation, item } = this.props;
		toggleReactionPicker(item);
		navigation.navigate('ReactionPickerView');
	}

	render() {
		const {
			item, user, style, archived, baseUrl, useRealName, broadcast, customEmojis, fetchThreadName, customThreadTimeFormat, onOpenFileModal, timeFormat, useMarkdown
		} = this.props;
		const {
			_id, msg, ts, attachments, urls, reactions, t, avatar, u, alias, editedBy, role, drid, dcount, dlm, tmid, tcount, tlm, tmsg, mentions, channels
		} = item;

		return (
			<Message
				id={_id}
				msg={msg}
				author={u}
				ts={ts}
				type={t}
				attachments={attachments}
				urls={urls}
				reactions={reactions}
				onReactionsPress={this.onReactionPress}
				alias={alias}
				avatar={avatar}
				user={user}
				timeFormat={timeFormat}
				customThreadTimeFormat={customThreadTimeFormat}
				style={style}
				archived={archived}
				broadcast={broadcast}
				baseUrl={baseUrl}
				customEmojis={customEmojis}
				useRealName={useRealName}
				role={role}
				drid={drid}
				dcount={dcount}
				dlm={dlm}
				tmid={tmid}
				tcount={tcount}
				tlm={tlm}
				tmsg={tmsg}
				useMarkdown={useMarkdown}
				fetchThreadName={fetchThreadName}
				mentions={mentions}
				channels={channels}
				isEdited={editedBy && !!editedBy.username}
				isHeader={this.isHeader}
				isThreadReply={this.isThreadReply}
				isThreadSequential={this.isThreadSequential}
				isInfo={this.isInfo}
				isTemp={this.isTemp}
				hasError={this.hasError}
				onErrorPress={this.onErrorPress}
				onPress={this.onPress}
				onLongPress={this.onLongPress}
				onReactionLongPress={this.onReactionLongPress}
				onReactionPress={this.onReactionPress}
				replyBroadcast={this.replyBroadcast}
				toggleReactionPicker={this.openReactionPicker}
				onDiscussionPress={this.onDiscussionPress}
				onOpenFileModal={onOpenFileModal}
				getCustomEmoji={getCustomEmoji}
			/>
		);
	}
}
