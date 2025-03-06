import React from 'react';
import { Keyboard, ViewStyle } from 'react-native';

import Message from './Message';
import MessageContext from './Context';
import { debounce } from '../../lib/methods/helpers';
import { getMessageTranslation } from './utils';
import { TSupportedThemes, withTheme } from '../../theme';
import openLink from '../../lib/methods/helpers/openLink';
import { IAttachment, TAnyMessageModel, TGetCustomEmoji } from '../../definitions';
import { IRoomInfoParam } from '../../views/SearchMessagesView';
import { E2E_MESSAGE_TYPE, E2E_STATUS, messagesStatus } from '../../lib/constants';
import MessageSeparator from '../MessageSeparator';

interface IMessageContainerProps {
	item: TAnyMessageModel;
	user: {
		id: string;
		username: string;
		token: string;
	};
	msg?: string;
	rid: string;
	timeFormat?: string;
	style?: ViewStyle;
	archived?: boolean;
	broadcast?: boolean;
	previousItem?: TAnyMessageModel;
	baseUrl: string;
	Message_GroupingPeriod?: number;
	isReadReceiptEnabled?: boolean;
	isThreadRoom?: boolean;
	isSystemMessage?: boolean;
	useRealName?: boolean;
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
	status?: number;
	isIgnored?: boolean;
	highlighted?: boolean;
	getCustomEmoji: TGetCustomEmoji;
	onLongPress?: (item: TAnyMessageModel) => void;
	onReactionPress?: (emoji: string, id: string) => void;
	onEncryptedPress?: () => void;
	onDiscussionPress?: (item: TAnyMessageModel) => void;
	onThreadPress?: (item: TAnyMessageModel) => void;
	errorActionsShow?: (item: TAnyMessageModel) => void;
	replyBroadcast?: (item: TAnyMessageModel) => void;
	reactionInit?: (messageId: string) => void;
	fetchThreadName?: (tmid: string, id: string) => Promise<string | undefined>;
	showAttachment?: (file: IAttachment) => void;
	onReactionLongPress?: (item: TAnyMessageModel) => void;
	navToRoomInfo?: (navParam: IRoomInfoParam) => void;
	handleEnterCall?: () => void;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
	onAnswerButtonPress?: Function;
	threadBadgeColor?: string;
	toggleFollowThread?: (isFollowingThread: boolean, tmid?: string) => Promise<void>;
	jumpToMessage?: (link: string) => void;
	onPress?: () => void;
	theme?: TSupportedThemes;
	closeEmojiAndAction?: (action?: Function, params?: any) => void;
	isBeingEdited?: boolean;
	isPreview?: boolean;
	dateSeparator?: Date | string | null;
	showUnreadSeparator?: boolean;
}

interface IMessageContainerState {
	isManualUnignored: boolean;
}

class MessageContainer extends React.Component<IMessageContainerProps, IMessageContainerState> {
	static defaultProps = {
		getCustomEmoji: () => null,
		onLongPress: () => {},
		blockAction: () => {},
		archived: false,
		broadcast: false,
		isIgnored: false,
		theme: 'light' as TSupportedThemes
	};

	state = { isManualUnignored: false };

	private subscription?: Function;

	componentDidMount() {
		const { item } = this.props;
		// @ts-ignore
		if (item && item.experimentalSubscribe) {
			// TODO: Update watermelonDB to recognize experimentalSubscribe at types
			// experimentalSubscribe(subscriber: (isDeleted: boolean) => void, debugInfo?: any): Unsubscribe
			// @ts-ignore
			this.subscription = item.experimentalSubscribe(() => {
				this.forceUpdate();
			});
		}
	}

	shouldComponentUpdate(nextProps: IMessageContainerProps, nextState: IMessageContainerState) {
		const { isManualUnignored } = this.state;
		const {
			threadBadgeColor,
			isIgnored,
			highlighted,
			previousItem,
			autoTranslateRoom,
			autoTranslateLanguage,
			isBeingEdited,
			showUnreadSeparator,
			dateSeparator
		} = this.props;

		if (nextProps.showUnreadSeparator !== showUnreadSeparator) {
			return true;
		}
		if (nextProps.dateSeparator !== dateSeparator) {
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
		if (nextProps.previousItem?._id !== previousItem?._id) {
			return true;
		}
		if (isBeingEdited !== nextProps.isBeingEdited) {
			return true;
		}
		if (nextProps.autoTranslateRoom !== autoTranslateRoom) {
			return true;
		}
		if (nextProps.autoTranslateRoom !== autoTranslateRoom || nextProps.autoTranslateLanguage !== autoTranslateLanguage) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.subscription) {
			this.subscription();
		}
	}

	onPressAction = () => {
		const { closeEmojiAndAction } = this.props;

		if (closeEmojiAndAction) {
			return closeEmojiAndAction(this.onPress);
		}

		return this.onPress();
	};

	onPress = debounce(
		() => {
			const { onPress } = this.props;
			if (this.isIgnored) {
				return this.onIgnoredMessagePress();
			}

			if (onPress) {
				return onPress();
			}

			const { item, isThreadRoom } = this.props;
			Keyboard.dismiss();

			if ((item.tlm || item.tmid) && !isThreadRoom) {
				this.onThreadPress();
			}

			const { onDiscussionPress } = this.props;

			if (item.dlm && onDiscussionPress) {
				onDiscussionPress(item);
			}
		},
		300,
		true
	);

	onLongPress = () => {
		const { archived, onLongPress, item } = this.props;
		if (this.isInfo || this.hasError || this.isEncrypted || archived) {
			return;
		}
		if (onLongPress) {
			onLongPress(item);
		}
	};

	onErrorPress = () => {
		const { errorActionsShow, item } = this.props;
		if (errorActionsShow) {
			errorActionsShow(item);
		}
	};

	onReactionPress = (emoji: string) => {
		const { onReactionPress, item } = this.props;
		if (onReactionPress) {
			onReactionPress(emoji, item.id);
		}
	};

	onReactionLongPress = () => {
		const { onReactionLongPress, item } = this.props;
		if (onReactionLongPress) {
			onReactionLongPress(item);
		}
	};

	onEncryptedPress = () => {
		const { onEncryptedPress } = this.props;
		if (onEncryptedPress) {
			onEncryptedPress();
		}
	};

	onDiscussionPress = () => {
		const { onDiscussionPress, item } = this.props;
		if (onDiscussionPress) {
			onDiscussionPress(item);
		}
	};

	onThreadPress = () => {
		const { onThreadPress, item } = this.props;
		if (onThreadPress) {
			onThreadPress(item);
		}
	};

	onAnswerButtonPress = (msg: string) => {
		const { onAnswerButtonPress } = this.props;
		if (onAnswerButtonPress) {
			onAnswerButtonPress(msg, false);
		}
	};

	onIgnoredMessagePress = () => {
		this.setState({ isManualUnignored: true });
	};

	get isHeader(): boolean {
		const { item, previousItem, broadcast, Message_GroupingPeriod } = this.props;
		if (this.hasError || (previousItem && previousItem.status === messagesStatus.ERROR)) {
			return true;
		}
		try {
			if (
				previousItem &&
				// @ts-ignore TODO: IMessage vs IMessageFromServer non-sense
				previousItem.ts.toDateString() === item.ts.toDateString() &&
				previousItem.u.username === item.u.username &&
				!(previousItem.groupable === false || item.groupable === false || broadcast === true) &&
				// @ts-ignore TODO: IMessage vs IMessageFromServer non-sense
				item.ts - previousItem.ts < Message_GroupingPeriod * 1000 &&
				previousItem.tmid === item.tmid &&
				item.t !== 'rm' &&
				previousItem.t !== 'rm'
			) {
				return false;
			}
			return true;
		} catch (error) {
			return true;
		}
	}

	get isThreadReply(): boolean {
		const { item, previousItem, isThreadRoom } = this.props;
		if (isThreadRoom) {
			return false;
		}
		if (previousItem && item.tmid && previousItem.tmid !== item.tmid && previousItem.id !== item.tmid) {
			return true;
		}
		return false;
	}

	get isThreadSequential(): boolean {
		const { item, isThreadRoom } = this.props;
		if (isThreadRoom) {
			return false;
		}
		return !!item.tmid;
	}

	get isEncrypted(): boolean {
		const { item } = this.props;
		const { t, e2e } = item;
		return t === E2E_MESSAGE_TYPE && e2e !== E2E_STATUS.DONE;
	}

	get isInfo(): string | boolean {
		const { item } = this.props;
		if (['e2e', 'discussion-created', 'jitsi_call_started', 'videoconf'].includes(item.t)) {
			return false;
		}
		return item.t;
	}

	get isTemp(): boolean {
		const { item } = this.props;
		return item.status === messagesStatus.TEMP || item.status === messagesStatus.ERROR;
	}

	get isIgnored(): boolean {
		const { isManualUnignored } = this.state;
		const { isIgnored } = this.props;
		if (isManualUnignored) {
			return false;
		}
		return isIgnored ?? false;
	}

	get hasError(): boolean {
		const { item } = this.props;
		return item.status === messagesStatus.ERROR;
	}

	reactionInit = () => {
		const { reactionInit, item } = this.props;
		if (reactionInit) {
			reactionInit(item.id);
		}
	};

	replyBroadcast = () => {
		const { replyBroadcast, item } = this.props;
		if (replyBroadcast) {
			replyBroadcast(item);
		}
	};

	onLinkPress = (link: string): void => {
		const { item, jumpToMessage, theme } = this.props;
		const isMessageLink = item?.attachments?.findIndex((att: IAttachment) => att?.message_link === link) !== -1;
		if (isMessageLink && jumpToMessage) {
			return jumpToMessage(link);
		}
		openLink(link, theme);
	};

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
			navToRoomInfo = () => {},
			getCustomEmoji,
			isThreadRoom,
			handleEnterCall,
			blockAction,
			rid,
			threadBadgeColor,
			toggleFollowThread,
			jumpToMessage,
			highlighted,
			isBeingEdited,
			isPreview,
			showUnreadSeparator,
			dateSeparator
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
			replies,
			md,
			comment,
			pinned
		} = item;

		let message = msg;
		let isTranslated = false;
		const otherUserMessage = u?.username !== user?.username;
		// "autoTranslateRoom" and "autoTranslateLanguage" are properties from the subscription
		// "autoTranslateMessage" is a toggle between "View Original" and "Translate" state
		if (autoTranslateRoom && autoTranslateMessage && autoTranslateLanguage && otherUserMessage) {
			const messageTranslated = getMessageTranslation(item, autoTranslateLanguage);
			isTranslated = !!messageTranslated;
			message = messageTranslated || message;
		}

		const canTranslateMessage = autoTranslateRoom && autoTranslateLanguage && autoTranslateMessage !== false && otherUserMessage;

		return (
			<MessageContext.Provider
				value={{
					id,
					rid,
					user,
					baseUrl,
					onPress: this.onPressAction,
					onLongPress: this.onLongPress,
					reactionInit: this.reactionInit,
					onErrorPress: this.onErrorPress,
					replyBroadcast: this.replyBroadcast,
					onReactionPress: this.onReactionPress,
					onEncryptedPress: this.onEncryptedPress,
					onDiscussionPress: this.onDiscussionPress,
					onReactionLongPress: this.onReactionLongPress,
					onLinkPress: this.onLinkPress,
					onAnswerButtonPress: this.onAnswerButtonPress,
					jumpToMessage,
					threadBadgeColor,
					toggleFollowThread,
					replies,
					translateLanguage: canTranslateMessage ? autoTranslateLanguage : undefined,
					isEncrypted: this.isEncrypted
				}}>
				<MessageSeparator ts={dateSeparator} unread={showUnreadSeparator} />
				{/* @ts-ignore*/}
				<Message
					id={id}
					msg={message}
					md={md}
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
					isEdited={(editedBy && !!editedBy.username) ?? false}
					isHeader={this.isHeader}
					isThreadReply={this.isThreadReply}
					isThreadSequential={this.isThreadSequential}
					isThreadRoom={!!isThreadRoom}
					isInfo={this.isInfo}
					isTemp={this.isTemp}
					isEncrypted={this.isEncrypted}
					hasError={this.hasError}
					showAttachment={showAttachment}
					getCustomEmoji={getCustomEmoji}
					navToRoomInfo={navToRoomInfo}
					handleEnterCall={handleEnterCall}
					blockAction={blockAction}
					highlighted={highlighted}
					comment={comment}
					isTranslated={isTranslated}
					isBeingEdited={isBeingEdited}
					isPreview={isPreview}
					pinned={pinned}
				/>
			</MessageContext.Provider>
		);
	}
}

export default withTheme(MessageContainer);
