import { memo } from 'react';

import Message from './Message';
import MessageContext, { type IMessageContext } from './Context';
import { type IAttachment, type TAnyMessageModel, type TGetCustomEmoji } from '../../definitions';
import { type IRoomInfoParam } from '../../views/SearchMessagesView';
import MessageSeparator from '../MessageSeparator';
import { MessageProvider } from './MessageStore';

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
	closeEmojiAndAction?: (action?: Function, params?: any) => void;
	isPreview?: boolean;
	dateSeparator?: Date | string | null;
	showUnreadSeparator?: boolean;
}

const EMPTY: IMessageContext = {};

const MessageContainer = (props: IMessageContainerProps) => {
	'use memo';

	const { item, previousItem, dateSeparator, showUnreadSeparator } = props;
	return (
		<MessageProvider
			item={item}
			previousItem={previousItem}
			onPress={props.onPress}
			onLongPress={props.onLongPress}
			threadBadgeColor={props.threadBadgeColor}>
			<MessageContext.Provider value={EMPTY}>
				<Message
					rid={props.rid}
					timeFormat={props.timeFormat}
					archived={props.archived ?? false}
					broadcast={props.broadcast ?? false}
					useRealName={props.useRealName}
					isReadReceiptEnabled={props.isReadReceiptEnabled}
					isThreadRoom={!!props.isThreadRoom}
					isPreview={props.isPreview}
					highlighted={props.highlighted}
					isIgnored={props.isIgnored ?? false}
					autoTranslateLanguage={props.autoTranslateLanguage}
				/>
				<MessageSeparator ts={dateSeparator} unread={showUnreadSeparator} />
			</MessageContext.Provider>
		</MessageProvider>
	);
};

export default memo(MessageContainer);
