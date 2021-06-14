import React from 'react';
import PropTypes from 'prop-types';
import { Keyboard } from 'react-native';

import Message from './Message';
import MessageContext from './Context';
import debounce from '../../utils/debounce';
import { SYSTEM_MESSAGES, getMessageTranslation } from './utils';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/encryption/constants';
import messagesStatus from '../../constants/messagesStatus';
import { withTheme } from '../../theme';
import openLink from '../../utils/openLink';

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
		style: PropTypes.any,
		archived: PropTypes.bool,
		broadcast: PropTypes.bool,
		previousItem: PropTypes.object,
		baseUrl: PropTypes.string,
		Message_GroupingPeriod: PropTypes.number,
		isReadReceiptEnabled: PropTypes.bool,
		isThreadRoom: PropTypes.bool,
		useRealName: PropTypes.bool,
		autoTranslateRoom: PropTypes.bool,
		autoTranslateLanguage: PropTypes.string,
		status: PropTypes.number,
		isIgnored: PropTypes.bool,
		highlighted: PropTypes.bool,
		getCustomEmoji: PropTypes.func,
		onLongPress: PropTypes.func,
		onReactionPress: PropTypes.func,
		onEncryptedPress: PropTypes.func,
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
		theme: PropTypes.string,
		threadBadgeColor: PropTypes.string,
		toggleFollowThread: PropTypes.func,
		jumpToMessage: PropTypes.func,
		onPress: PropTypes.func
	}

	static defaultProps = {
		getCustomEmoji: () => {},
		onLongPress: () => {},
		onReactionPress: () => {},
		onEncryptedPress: () => {},
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
		isIgnored: false,
		theme: 'light'
	}

	state = { isManualUnignored: false };

	componentDidMount() {
		const { item } = this.props;
		if (item && item.observe) {
			const observable = item.observe();
			this.subscription = observable.subscribe(() => {
				this.forceUpdate();
			});
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { isManualUnignored } = this.state;
		const {
			theme, threadBadgeColor, isIgnored, highlighted
		} = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.highlighted !== highlighted) {
			return true;
		}
		if (nextProps.threadBadgeColor !== threadBadgeColor) {
			return true;
		}
		if (nextProps.isIgnored !== isIgnored) {
			return true;
		}
		if (nextState.isManualUnignored !== isManualUnignored) {
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
		const { onPress } = this.props;
		if (this.isIgnored) {
			return this.onIgnoredMessagePress();
		}

		if (onPress) {
			return onPress();
		}

		const { item, isThreadRoom } = this.props;
		Keyboard.dismiss();

		if (((item.tlm || item.tmid) && !isThreadRoom)) {
			this.onThreadPress();
		}
	}, 300, true);

	onLongPress = () => {
		const { archived, onLongPress, item } = this.props;
		if (this.isInfo || this.hasError || this.isEncrypted || archived) {
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

	onEncryptedPress = () => {
		const { onEncryptedPress } = this.props;
		if (onEncryptedPress) {
			onEncryptedPress();
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

	onIgnoredMessagePress = () => {
		this.setState({ isManualUnignored: true });
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
		const { item, isThreadRoom } = this.props;
		if (isThreadRoom) {
			return false;
		}
		return item.tmid;
	}

	get isEncrypted() {
		const { item } = this.props;
		const { t, e2e } = item;
		return t === E2E_MESSAGE_TYPE && e2e !== E2E_STATUS.DONE;
	}

	get isInfo() {
		const { item } = this.props;
		return SYSTEM_MESSAGES.includes(item.t);
	}

	get isTemp() {
		const { item } = this.props;
		return item.status === messagesStatus.TEMP || item.status === messagesStatus.ERROR;
	}

	get isIgnored() {
		const { isManualUnignored } = this.state;
		const { isIgnored } = this.props;
		return isManualUnignored ? false : isIgnored;
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

	onLinkPress = (link) => {
		const { item, theme, jumpToMessage } = this.props;
		const isMessageLink = item?.attachments?.findIndex(att => att?.message_link === link) !== -1;
		if (isMessageLink) {
			return jumpToMessage(link);
		}
		openLink(link, theme);
	}

	render() {
		const {
			item,
			user,
			style,
			archived,
			baseUrl,
			useRealName,
			broadcast,
			fetchThreadName,
			showAttachment,
			timeFormat,
			isReadReceiptEnabled,
			autoTranslateRoom,
			autoTranslateLanguage,
			navToRoomInfo,
			getCustomEmoji,
			isThreadRoom,
			callJitsi,
			blockAction,
			rid,
			theme,
			threadBadgeColor,
			toggleFollowThread,
			jumpToMessage,
			highlighted
		} = this.props;
		const {
			id,
			msg,
			ts,
			attachments,
			urls,
			reactions,
			t,
			avatar,
			emoji,
			u,
			alias,
			editedBy,
			role,
			drid,
			dcount,
			dlm,
			tmid,
			tcount,
			tlm,
			tmsg,
			mentions,
			channels,
			unread,
			blocks,
			autoTranslate: autoTranslateMessage,
			replies
		} = item;

		let message = msg;
		// "autoTranslateRoom" and "autoTranslateLanguage" are properties from the subscription
		// "autoTranslateMessage" is a toggle between "View Original" and "Translate" state
		if (autoTranslateRoom && autoTranslateMessage) {
			message = getMessageTranslation(item, autoTranslateLanguage) || message;
		}

		return (
			<MessageContext.Provider
				value={{
					user,
					baseUrl,
					onPress: this.onPress,
					onLongPress: this.onLongPress,
					reactionInit: this.reactionInit,
					onErrorPress: this.onErrorPress,
					replyBroadcast: this.replyBroadcast,
					onReactionPress: this.onReactionPress,
					onEncryptedPress: this.onEncryptedPress,
					onDiscussionPress: this.onDiscussionPress,
					onReactionLongPress: this.onReactionLongPress,
					onLinkPress: this.onLinkPress,
					jumpToMessage,
					threadBadgeColor,
					toggleFollowThread,
					replies
				}}
			>
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
					emoji={emoji}
					timeFormat={timeFormat}
					style={style}
					archived={archived}
					broadcast={broadcast}
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
					fetchThreadName={fetchThreadName}
					mentions={mentions}
					channels={channels}
					isIgnored={this.isIgnored}
					isEdited={editedBy && !!editedBy.username}
					isHeader={this.isHeader}
					isThreadReply={this.isThreadReply}
					isThreadSequential={this.isThreadSequential}
					isThreadRoom={isThreadRoom}
					isInfo={this.isInfo}
					isTemp={this.isTemp}
					isEncrypted={this.isEncrypted}
					hasError={this.hasError}
					showAttachment={showAttachment}
					getCustomEmoji={getCustomEmoji}
					navToRoomInfo={navToRoomInfo}
					callJitsi={callJitsi}
					blockAction={blockAction}
					theme={theme}
					highlighted={highlighted}
				/>
			</MessageContext.Provider>
		);
	}
}

export default withTheme(MessageContainer);
