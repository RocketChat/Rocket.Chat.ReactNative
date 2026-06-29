import { createContext } from 'react';

import { type TGetCustomEmoji } from '../../definitions/IEmoji';
import { type IAttachment } from '../../definitions';
import { type IRoomInfoParam } from '../../views/SearchMessagesView';

export interface IMessageContext {
	id?: string;
	rid?: string;
	user?: { id?: string; username?: string; token?: string };
	baseUrl?: string;
	onPress?: () => void;
	onLongPress?: () => void;
	reactionInit?: () => void;
	onErrorPress?: () => void;
	replyBroadcast?: () => void;
	onReactionPress?: (emoji: string) => void;
	onEncryptedPress?: () => void;
	onDiscussionPress?: () => void;
	onThreadPress?: () => void;
	onReactionLongPress?: () => void;
	onLinkPress?: (link: string) => void;
	onAnswerButtonPress?: (msg: string) => void;
	jumpToMessage?: (link: string) => void;
	threadBadgeColor?: string;
	toggleFollowThread?: (isFollowingThread: boolean, tmid?: string) => Promise<void>;
	replies?: string[];
	translateLanguage?: string;
	isEncrypted?: boolean;
	e2e?: string;
	getCustomEmoji?: TGetCustomEmoji;
	navToRoomInfo?: (navParam: IRoomInfoParam) => void;
	showAttachment?: (file: IAttachment) => void;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
	handleEnterCall?: () => void;
	fetchThreadName?: (tmid: string, id: string) => Promise<string | undefined>;
}

const MessageContext = createContext<IMessageContext>({});
export default MessageContext;
