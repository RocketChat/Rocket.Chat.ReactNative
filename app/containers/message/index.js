import React from 'react';
import PropTypes from 'prop-types';
import { KeyboardUtils } from 'react-native-keyboard-input';
import { Alert, Clipboard, Share } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';

import Message from './Message';
import debounce from '../../utils/debounce';
import { SYSTEM_MESSAGES, getCustomEmoji, getMessageTranslation } from './utils';
import I18n from '../../i18n';
import database from '../../lib/realm';
import messagesStatus from '../../constants/messagesStatus';
import {
	deleteRequest as deleteRequestAction,
	editInit as editInitAction,
	replyInit as replyInitAction,
	togglePinRequest as togglePinRequestAction,
	toggleStarRequest as toggleStarRequestAction
} from '../../actions/messages';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import Navigation from '../../lib/Navigation';
import EventEmitter from '../../utils/events';
import { LISTNER, SNAP_PONITS } from '../../views/ActionSheet';

@connect(
	state => ({
		Message_AllowDeleting: state.settings.Message_AllowDeleting,
		Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes,
		Message_AllowEditing: state.settings.Message_AllowEditing,
		Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes,
		Message_AllowPinning: state.settings.Message_AllowPinning,
		Message_AllowStarring: state.settings.Message_AllowStarring,
		Message_Read_Receipt_Store_Users: state.settings.Message_Read_Receipt_Store_Users
	}),
	dispatch => ({
		deleteRequest: message => dispatch(deleteRequestAction(message)),
		editInit: message => dispatch(editInitAction(message)),
		toggleStarRequest: message => dispatch(toggleStarRequestAction(message)),
		togglePinRequest: message => dispatch(togglePinRequestAction(message)),
		replyInit: (message, mention) => dispatch(replyInitAction(message, mention))
	})
)
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
		isReadReceiptEnabled: PropTypes.bool,
		useRealName: PropTypes.bool,
		useMarkdown: PropTypes.bool,
		autoTranslateRoom: PropTypes.bool,
		autoTranslateLanguage: PropTypes.string,
		status: PropTypes.number,
		onReactionPress: PropTypes.func,
		onDiscussionPress: PropTypes.func,
		onThreadPress: PropTypes.func,
		errorActionsShow: PropTypes.func,
		replyBroadcast: PropTypes.func,
		toggleReactionPicker: PropTypes.func,
		fetchThreadName: PropTypes.func,
		onOpenFileModal: PropTypes.func,
		onReactionLongPress: PropTypes.func,
		room: PropTypes.object.isRequired,
		tmid: PropTypes.string,

		toast: PropTypes.element,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		toggleStarRequest: PropTypes.func.isRequired,
		togglePinRequest: PropTypes.func.isRequired,
		replyInit: PropTypes.func.isRequired,
		Message_AllowDeleting: PropTypes.bool,
		Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
		Message_AllowEditing: PropTypes.bool,
		Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
		Message_AllowPinning: PropTypes.bool,
		Message_AllowStarring: PropTypes.bool,
		Message_Read_Receipt_Store_Users: PropTypes.bool
	}

	static defaultProps = {
		_updatedAt: new Date(),
		archived: false,
		broadcast: false
	}

	shouldComponentUpdate(nextProps) {
		const {
			status, item, _updatedAt, autoTranslateRoom
		} = this.props;

		if (status !== nextProps.status) {
			return true;
		}
		if (autoTranslateRoom !== nextProps.autoTranslateRoom) {
			return true;
		}
		if (item.tmsg !== nextProps.item.tmsg) {
			return true;
		}
		if (item.unread !== nextProps.item.unread) {
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
		const {
			archived, Message_AllowStarring, Message_AllowPinning, Message_Read_Receipt_Store_Users, item, room, user
		} = this.props;
		if (this.isInfo || this.hasError || archived) {
			return;
		}
		const options = [
			// { label: I18n.t('Cancel'), handler: () => {}, icon: 'circle-cross' },
			{ label: I18n.t('Permalink'), handler: this.handlePermalink, icon: 'permalink' },
			{ label: I18n.t('Copy'), handler: this.handleCopy, icon: 'copy' },
			{ label: I18n.t('Share'), handler: this.handleShare, icon: 'share' }
		];

		// Reply
		if (!this.isRoomReadOnly()) {
			options.push({ label: I18n.t('Reply'), handler: this.handleReply, icon: 'reply' });
		}

		// Edit
		if (this.allowEdit()) {
			options.push({ label: I18n.t('Edit'), handler: this.handleEdit, icon: 'edit' });
		}
		// Quote
		if (!this.isRoomReadOnly()) {
			options.push({ label: I18n.t('Quote'), handler: this.handleQuote, icon: 'quote' });
		}
		// Star
		if (Message_AllowStarring) {
			options.push({ label: I18n.t(item && item.starred ? 'Unstar' : 'Star'), handler: this.handleStar, icon: 'star' });
		}
		// Pin
		if (Message_AllowPinning) {
			options.push({ label: I18n.t(item && item.pinned ? 'Unpin' : 'Pin'), handler: this.handlePin, icon: 'pin' });
		}

		// Reaction
		if (!this.isRoomReadOnly() || this.canReactWhenReadOnly()) {
			options.push({ label: I18n.t('Add_Reaction'), handler: this.handleReaction, icon: 'emoji' });
		}
		// Delete
		if (this.allowDelete()) {
			options.push({ label: I18n.t('Delete'), handler: this.handleDelete, icon: 'cross' });
		}

		// Report
		options.push({ label: I18n.t('Report'), handler: this.handleReport, icon: 'flag' });

		// Toggle - translate
		if (room.autoTranslate && item.u && item.u._id !== user.id) {
			options.push({ lable: I18n.t(item.autoTranslate ? 'View_Original' : 'Translate'), handler: this.handleToggleTranslation, icon: 'flag' });
		}

		// Read Receipts
		if (Message_Read_Receipt_Store_Users) {
			options.push({ label: I18n.t('Read_Receipt'), handler: this.handleReadReceipt, icon: 'flag' });
		}
		EventEmitter.emit(LISTNER, { options, snapPoint: SNAP_PONITS.HALF });
	}

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
	}

	toggleReactionPicker = () => {
		const { toggleReactionPicker } = this.props;
		if (toggleReactionPicker) {
			toggleReactionPicker(this.parseMessage());
		}
	}

	getPermalink = async(message) => {
		try {
			return await RocketChat.getPermalinkMessage(message);
		} catch (error) {
			return null;
		}
	}

	isOwn = (item, user) => item.u && item.u._id === user.id;

	isRoomReadOnly = () => {
		const { room } = this.props;
		return room.ro;
	}

	canReactWhenReadOnly = () => {
		const { room } = this.props;
		return room.reactWhenReadOnly;
	}

	allowEdit = () => {
		if (this.isRoomReadOnly()) {
			return false;
		}
		const {
			Message_AllowEditing: isEditAllowed, Message_AllowEditing_BlockEditInMinutes, item, user
		} = this.props;
		const editOwn = this.isOwn(item, user);

		if (!(this.hasEditPermission || (isEditAllowed && editOwn))) {
			return false;
		}
		const blockEditInMinutes = Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (item.ts != null) {
				msgTs = moment(item.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		}
		return true;
	}

	allowDelete = () => {
		if (this.isRoomReadOnly()) {
			return false;
		}
		const {
			Message_AllowDeleting: isDeleteAllowed, Message_AllowDeleting_BlockDeleteInMinutes, item, tmid, user
		} = this.props;

		// Prevent from deleting thread start message when positioned inside the thread
		if (tmid && tmid === item._id) {
			return false;
		}
		const deleteOwn = this.isOwn(item, user);
		if (!(this.hasDeletePermission || (isDeleteAllowed && deleteOwn) || this.hasForceDeletePermission)) {
			return false;
		}
		if (this.hasForceDeletePermission) {
			return true;
		}
		const blockDeleteInMinutes = Message_AllowDeleting_BlockDeleteInMinutes;
		if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
			let msgTs;
			if (item.ts != null) {
				msgTs = moment(item.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		}
		return true;
	}

	handleDelete = () => {
		const { deleteRequest, item } = this.props;
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('You_will_not_be_able_to_recover_this_message'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: 'delete' }),
					style: 'destructive',
					onPress: () => deleteRequest(item)
				}
			],
			{ cancelable: false }
		);
	}

	handleEdit = () => {
		const { item, editInit } = this.props;
		const { _id, msg, rid } = item;
		editInit({ _id, msg, rid });
	}

	handleCopy = async() => {
		const { item, toast } = this.props;
		await Clipboard.setString(item.msg);
		toast.show(I18n.t('Copied_to_clipboard'));
	}

	handleShare = async() => {
		const { item } = this.props;
		const permalink = await this.getPermalink(item);
		Share.share({
			message: permalink
		});
	};

	handleStar = () => {
		const { item, toggleStarRequest } = this.props;
		toggleStarRequest(item);
	}

	handlePermalink = async() => {
		const { item, toast } = this.props;
		const permalink = await this.getPermalink(item);
		Clipboard.setString(permalink);
		toast.show(I18n.t('Permalink_copied_to_clipboard'));
	}

	handlePin = () => {
		const { item, togglePinRequest } = this.props;
		togglePinRequest(item);
	}

	handleReply = () => {
		const { item, replyInit } = this.props;
		replyInit(item, true);
	}

	handleQuote = () => {
		const { item, replyInit } = this.props;
		replyInit(item, false);
	}

	handleReaction = () => {
		this.toggleReactionPicker();
	}

	handleReadReceipt = () => {
		const { item } = this.props;
		Navigation.navigate('ReadReceiptsView', { messageId: item._id });
	}

	handleReport = async() => {
		const { item } = this.props;
		try {
			await RocketChat.reportMessage(item._id);
			Alert.alert(I18n.t('Message_Reported'));
		} catch (err) {
			log('err_report_message', err);
		}
	}

	handleToggleTranslation = async() => {
		const { item, room } = this.props;
		try {
			const message = database.objectForPrimaryKey('messages', item._id);
			database.write(() => {
				message.autoTranslate = !message.autoTranslate;
				message._updatedAt = new Date();
			});
			const translatedMessage = getMessageTranslation(message, room.autoTranslateLanguage);
			if (!translatedMessage) {
				await RocketChat.translateMessage(item, room.autoTranslateLanguage);
			}
		} catch (err) {
			log('err_toggle_translation', err);
		}
	}


	replyBroadcast = () => {
		const { replyBroadcast } = this.props;
		if (replyBroadcast) {
			replyBroadcast(this.parseMessage());
		}
	}

	render() {
		const {
			item, user, style, archived, baseUrl, useRealName, broadcast, fetchThreadName, customThreadTimeFormat, onOpenFileModal, timeFormat, useMarkdown, isReadReceiptEnabled, autoTranslateRoom, autoTranslateLanguage
		} = this.props;
		const {
			_id, msg, ts, attachments, urls, reactions, t, avatar, u, alias, editedBy, role, drid, dcount, dlm, tmid, tcount, tlm, tmsg, mentions, channels, unread, autoTranslate: autoTranslateMessage
		} = item;

		let message = msg;
		// "autoTranslateRoom" and "autoTranslateLanguage" are properties from the subscription
		// "autoTranslateMessage" is a toggle between "View Original" and "Translate" state
		if (autoTranslateRoom && autoTranslateMessage) {
			message = getMessageTranslation(item, autoTranslateLanguage) || message;
		}

		return (
			<Message
				id={_id}
				msg={message}
				author={u}
				ts={ts}
				type={t}
				attachments={attachments}
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
				isInfo={this.isInfo}
				isTemp={this.isTemp}
				hasError={this.hasError}
				onErrorPress={this.onErrorPress}
				onPress={this.onPress}
				onLongPress={this.onLongPress}
				onReactionLongPress={this.onReactionLongPress}
				onReactionPress={this.onReactionPress}
				replyBroadcast={this.replyBroadcast}
				toggleReactionPicker={this.toggleReactionPicker}
				onDiscussionPress={this.onDiscussionPress}
				onOpenFileModal={onOpenFileModal}
				getCustomEmoji={getCustomEmoji}
			/>
		);
	}
}
