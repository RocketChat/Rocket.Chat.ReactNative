import React from 'react';
import PropTypes from 'prop-types';
import { KeyboardUtils } from 'react-native-keyboard-input';

import Message from './Message';
import debounce from '../../utils/debounce';
import { SYSTEM_MESSAGES, getMessageTranslation } from './utils';
import messagesStatus from '../../constants/messagesStatus';
import { withTheme } from '../../theme';

class MessageContainer extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		rid: PropTypes.string,
		timeFormat: PropTypes.string,
		customThreadTimeFormat: PropTypes.string,
		style: PropTypes.any,
		archived: PropTypes.bool,
		broadcast: PropTypes.bool,
		previousItem: PropTypes.object,
		baseUrl: PropTypes.string,
		Message_GroupingPeriod: PropTypes.number,
		isReadReceiptEnabled: PropTypes.bool,
		isThreadRoom: PropTypes.bool,
		useRealName: PropTypes.bool,
		useMarkdown: PropTypes.bool,
		autoTranslateRoom: PropTypes.bool,
		autoTranslateLanguage: PropTypes.string,
		status: PropTypes.number,
		getCustomEmoji: PropTypes.func,
		onLongPress: PropTypes.func,
		onReactionPress: PropTypes.func,
		onDiscussionPress: PropTypes.func,
		onThreadPress: PropTypes.func,
		errorActionsShow: PropTypes.func,
		replyBroadcast: PropTypes.func,
		reactionInit: PropTypes.func,
		fetchThreadName: PropTypes.func,
		showAttachment: PropTypes.func,
		onReactionLongPress: PropTypes.func,
		navToRoomInfo: PropTypes.func,
		callJitsi: PropTypes.func,
		blockAction: PropTypes.func,
		theme: PropTypes.string
	}

	static defaultProps = {
		getCustomEmoji: () => {},
		onLongPress: () => {},
		onReactionPress: () => {},
		onDiscussionPress: () => {},
		onThreadPress: () => {},
		errorActionsShow: () => {},
		replyBroadcast: () => {},
		reactionInit: () => {},
		fetchThreadName: () => {},
		showAttachment: () => {},
		onReactionLongPress: () => {},
		navToRoomInfo: () => {},
		callJitsi: () => {},
		blockAction: () => {},
		archived: false,
		broadcast: false,
		theme: 'light'
	}

	componentDidMount() {
		const { item } = this.props;
		if (item && item.observe) {
			const observable = item.observe();
			this.subscription = observable.subscribe(() => {
				this.forceUpdate();
			});
		}
	}

	shouldComponentUpdate(nextProps) {
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	onPress = debounce(() => {
		const { item, isThreadRoom } = this.props;
		KeyboardUtils.dismiss();

		if (((item.tlm || item.tmid) && !isThreadRoom)) {
			this.onThreadPress();
		}
	}, 300, true);

	onLongPress = () => {
		const { archived, onLongPress, item } = this.props;
		if (this.isInfo || this.hasError || archived) {
			return;
		}
		if (onLongPress) {
			onLongPress(item);
		}
	}

	onErrorPress = () => {
		const { errorActionsShow, item } = this.props;
		if (errorActionsShow) {
			errorActionsShow(item);
		}
	}

	onReactionPress = (emoji) => {
		const { onReactionPress, item } = this.props;
		if (onReactionPress) {
			onReactionPress(emoji, item.id);
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
		if (this.hasError || (previousItem && previousItem.status === messagesStatus.ERROR)) {
			return true;
		}
		try {
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
		} catch (error) {
			return true;
		}
	}

	get isThreadReply() {
		const {
			item, previousItem, isThreadRoom
		} = this.props;
		if (isThreadRoom) {
			return false;
		}
		if (previousItem && item.tmid && (previousItem.tmid !== item.tmid) && (previousItem.id !== item.tmid)) {
			return true;
		}
		return false;
	}

	get isThreadSequential() {
		const {
			item, previousItem, isThreadRoom
		} = this.props;
		if (isThreadRoom) {
			return false;
		}
		if (previousItem && item.tmid && ((previousItem.tmid === item.tmid) || (previousItem.id === item.tmid))) {
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

	reactionInit = () => {
		const { reactionInit, item } = this.props;
		if (reactionInit) {
			reactionInit(item);
		}
	}

	replyBroadcast = () => {
		const { replyBroadcast, item } = this.props;
		if (replyBroadcast) {
			replyBroadcast(item);
		}
	}

	render() {
		const {
			item, user, style, archived, baseUrl, useRealName, broadcast, fetchThreadName, customThreadTimeFormat, showAttachment, timeFormat, useMarkdown, isReadReceiptEnabled, autoTranslateRoom, autoTranslateLanguage, navToRoomInfo, getCustomEmoji, isThreadRoom, callJitsi, blockAction, rid, theme
		} = this.props;
		const {
			id, msg, ts, attachments, urls, reactions, t, avatar, u, alias, editedBy, role, drid, dcount, dlm, tmid, tcount, tlm, tmsg, mentions, channels, unread, blocks, autoTranslate: autoTranslateMessage
		} = item;

		let message = msg;
		// "autoTranslateRoom" and "autoTranslateLanguage" are properties from the subscription
		// "autoTranslateMessage" is a toggle between "View Original" and "Translate" state
		if (autoTranslateRoom && autoTranslateMessage) {
			message = getMessageTranslation(item, autoTranslateLanguage) || message;
		}

		return (
			<Message
				id={id}
				msg={message}
				rid={rid}
				author={u}
				ts={ts}
				type={t}
				attachments={attachments}
				blocks={blocks}
				urls={urls}
				reactions={reactions}
				alias={alias}
				avatar={avatar}
				user={user}
				timeFormat={timeFormat}
				customThreadTimeFormat={customThreadTimeFormat}
				style={style}
				archived={archived}
				broadcast={broadcast}
				baseUrl={baseUrl}
				useRealName={useRealName}
				isReadReceiptEnabled={isReadReceiptEnabled}
				unread={unread}
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
				isThreadRoom={isThreadRoom}
				isInfo={this.isInfo}
				isTemp={this.isTemp}
				hasError={this.hasError}
				onErrorPress={this.onErrorPress}
				onPress={this.onPress}
				onLongPress={this.onLongPress}
				onReactionLongPress={this.onReactionLongPress}
				onReactionPress={this.onReactionPress}
				replyBroadcast={this.replyBroadcast}
				reactionInit={this.reactionInit}
				onDiscussionPress={this.onDiscussionPress}
				showAttachment={showAttachment}
				getCustomEmoji={getCustomEmoji}
				navToRoomInfo={navToRoomInfo}
				callJitsi={callJitsi}
				blockAction={blockAction}
				theme={theme}
			/>
		);
	}
}

export default withTheme(MessageContainer);
