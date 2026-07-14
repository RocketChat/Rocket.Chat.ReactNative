import { type RefObject, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { sendLoadingEvent } from '../../../containers/Loading';
import { type IListContainerRef } from '../List/definitions';
import { type TGetMessageInfoResult } from '../services/getMessageInfo';
import { jumpToMessage as jumpToMessageService } from '../services/jumpToMessage';
import { type IRoomViewProps } from '../definitions';

export interface IUseJumpToMessageParams {
	rid?: string;
	tmid?: string;
	t?: string;
	listRef: RefObject<IListContainerRef | null>;
	navToRoom: (message: TGetMessageInfoResult) => void;
	navToThread: (message: TGetMessageInfoResult | { tmid: string }) => void;
}

export interface IUseJumpToMessageResult {
	jumpToMessage: (messageId: string, isFromReply?: boolean) => Promise<void>;
	cancelJumpToMessage: () => void;
	consumeJumpParam: (messageId: string) => void;
	onThreadMessagesLoaded: () => void;
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

	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const route = useRoute<IRoomViewProps['route']>();

	const pendingJumpRef = useRef<string | undefined>(route.params?.jumpToMessageId);
	const jumpToThreadIdRef = useRef<string | undefined>(route.params?.jumpToThreadId);

	const cancelJumpToMessage = () => {
		listRef.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	const jumpToMessage = (messageId: string, isFromReply?: boolean) =>
		jumpToMessageService({ messageId, isFromReply, rid, tmid, t, listRef, navToRoom, navToThread, cancel: cancelJumpToMessage });

	// Fire a jump from a Navigation param, then consume the one-shot param so re-selecting the SAME
	// message id reads as a change (undefined -> id edge) and re-fires, instead of matching a stale
	// param and no-opping. Both mount (initial param) and update (Search delivers via setParams) use this.
	const consumeJumpParam = (messageId: string) => {
		pendingJumpRef.current = undefined;
		jumpToMessage(messageId);
		navigation.setParams({ jumpToMessageId: undefined });
	};

	// Thread jump: fired from the store init's `onThreadMessagesLoaded` callback — the thread window is
	// populated by then, so the row exists (a non-anchored thread jump otherwise aborts and parks on the live tail).
	const onThreadMessagesLoaded = () => {
		if (pendingJumpRef.current) {
			const messageId = pendingJumpRef.current;
			pendingJumpRef.current = undefined;
			consumeJumpParam(messageId);
		}
	};

	// consumeJumpParam/navToThread are unstable across renders; refs keep the mount effect's deps to [tmid].
	const consumeJumpParamRef = useRef(consumeJumpParam);
	const navToThreadRef = useRef(navToThread);
	useEffect(() => {
		consumeJumpParamRef.current = consumeJumpParam;
		navToThreadRef.current = navToThread;
	});

	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => {
			// Main-list jump: re-anchors its own window, so fire immediately. A thread jump waits for its
			// rows and is fired from the store init's `onThreadMessagesLoaded` callback instead.
			if (pendingJumpRef.current && !tmid) {
				consumeJumpParamRef.current(pendingJumpRef.current);
			}
			if (jumpToThreadIdRef.current && !pendingJumpRef.current) {
				const threadId = jumpToThreadIdRef.current;
				jumpToThreadIdRef.current = undefined;
				navToThreadRef.current({ tmid: threadId });
			}
		});
		return () => task.cancel();
	}, [tmid]);

	const prevJumpToMessageIdRef = useRef(route.params?.jumpToMessageId);
	useEffect(() => {
		const next = route.params?.jumpToMessageId;
		if (next && next !== prevJumpToMessageIdRef.current) {
			consumeJumpParam(next);
		}
		prevJumpToMessageIdRef.current = next;
	}, [route.params?.jumpToMessageId, consumeJumpParam]);

	const prevJumpToThreadIdRef = useRef(route.params?.jumpToThreadId);
	useEffect(() => {
		const next = route.params?.jumpToThreadId;
		if (next && next !== prevJumpToThreadIdRef.current) {
			navToThread({ tmid: next });
		}
		prevJumpToThreadIdRef.current = next;
	}, [route.params?.jumpToThreadId, navToThread]);

	return { jumpToMessage, cancelJumpToMessage, consumeJumpParam, onThreadMessagesLoaded };
}
