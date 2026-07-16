import { type IAttachment } from './IAttachment';
import { type IEmoji } from './IEmoji';
import { type IMessage, type TAnyMessageModel } from './IMessage';
import { type IRoomInfoParam } from './IRoom';

export interface IUseRoomMessageHandlersResult {
	blockAction: (params: {
		actionId: string;
		appId: string;
		value: any;
		blockId: string;
		rid: string;
		mid: string;
	}) => Promise<any>;
	navToRoomInfo: (navParam: IRoomInfoParam) => void;
	handleEnterCall: () => void;
	onDiscussionPress: (drid: TAnyMessageModel['drid']) => void;
	onThreadPress: (item: TAnyMessageModel) => void;
	onEncryptedPress: () => void;
	showAttachment: (attachment: IAttachment) => void;
	onReactionPress: (emoji: IEmoji, messageId: string) => Promise<void>;
	onReactionLongPress: (message: TAnyMessageModel) => void;
	replyBroadcast: (message: IMessage) => void;
	fetchThreadName: (threadId: string, messageId: string) => Promise<string | undefined>;
	toggleFollowThread: (isFollowingThread: boolean, threadId?: string) => Promise<void>;
	onAnswerButtonPress: (message?: string, tshow?: boolean) => void;
}
