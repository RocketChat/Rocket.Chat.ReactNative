interface IConferenceChatThreadId {
	startedMessageId?: string;
	discussionRid?: string;
	persistentChatEnabled: boolean;
	windowEnabled: boolean;
	chatMode?: string;
}

export const getConferenceChatThreadId = ({
	startedMessageId,
	discussionRid,
	persistentChatEnabled,
	windowEnabled,
	chatMode
}: IConferenceChatThreadId): string | undefined =>
	!discussionRid && persistentChatEnabled && windowEnabled && chatMode === 'thread' ? startedMessageId : undefined;
