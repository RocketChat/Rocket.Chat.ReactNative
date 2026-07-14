import { type RefObject } from 'react';

import { sendLoadingEvent } from '../../../containers/Loading';
import { type IListContainerRef } from '../List/definitions';
import { type TGetMessageInfoResult } from '../services/getMessageInfo';
import { jumpToMessage as jumpToMessageService } from '../services/jumpToMessage';

export interface IUseJumpToMessageParams {
	rid?: string;
	tmid?: string;
	t?: string;
	listRef: RefObject<IListContainerRef | null>;
	navToRoom: (message: TGetMessageInfoResult) => void;
	navToThread: (message: TGetMessageInfoResult) => void;
}

export interface IUseJumpToMessageResult {
	jumpToMessage: (messageId: string, isFromReply?: boolean) => Promise<void>;
	cancelJumpToMessage: () => void;
}

export function useJumpToMessage({
	rid,
	tmid,
	t,
	listRef,
	navToRoom,
	navToThread
}: IUseJumpToMessageParams): IUseJumpToMessageResult {
	'use memo';

	const cancelJumpToMessage = () => {
		listRef.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	const jumpToMessage = (messageId: string, isFromReply?: boolean) =>
		jumpToMessageService({ messageId, isFromReply, rid, tmid, t, listRef, navToRoom, navToThread, cancel: cancelJumpToMessage });

	return { jumpToMessage, cancelJumpToMessage };
}
