import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { sendLoadingEvent } from '../../../containers/Loading';
import { useLiveRef } from '../../../lib/hooks/useLiveRef';
import { type IRoomViewProps, type IUseJumpToMessageParams, type IUseJumpToMessageResult } from '../definitions';
import { jumpToMessage as jumpToMessageService } from '../services/jumpToMessage';

// Fire onChange whenever a one-shot route param transitions to a new truthy value (undefined -> id, or
// id -> different id). onChange is live-mirrored so an unstable inline callback doesn't retrigger the effect.
function useChangedParam(value: string | undefined, onChange: (value: string) => void) {
	const onChangeRef = useLiveRef(onChange);
	const prevRef = useRef(value);
	useEffect(() => {
		if (value && value !== prevRef.current) {
			onChangeRef.current(value);
		}
		prevRef.current = value;
	}, [value, onChangeRef]);
}

export function useJumpToMessage({
	rid,
	tmid,
	t,
	listContainerRef,
	navToRoom,
	navToThread
}: IUseJumpToMessageParams): IUseJumpToMessageResult {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const route = useRoute<IRoomViewProps['route']>();

	const pendingJumpRef = useRef<string | undefined>(route.params?.jumpToMessageId);
	const jumpToThreadIdRef = useRef<string | undefined>(route.params?.jumpToThreadId);

	const cancelJumpToMessage = () => {
		listContainerRef.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	const jumpToMessage = (messageId: string, isFromReply?: boolean) =>
		jumpToMessageService({
			messageId,
			isFromReply,
			rid,
			tmid,
			t,
			listContainerRef,
			navToRoom,
			navToThread,
			cancel: cancelJumpToMessage
		});

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

	// Live-mirrored (see useLiveRef) so the mount effect can key on [tmid] despite these being unstable.
	const consumeJumpParamRef = useLiveRef(consumeJumpParam);
	const navToThreadRef = useLiveRef(navToThread);

	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => {
			// Main-list jump: re-anchors its own window, so fire immediately. A thread jump waits for its
			// rows and is fired from the store init's `onThreadMessagesLoaded` callback instead.
			if (pendingJumpRef.current && !tmid) {
				consumeJumpParamRef.current(pendingJumpRef.current);
			}
		});
		return () => task.cancel();
	}, [tmid, consumeJumpParamRef]);

	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => {
			// Pending jump wins: the thread nav param is dropped so the jump isn't hijacked mid-flight.
			if (jumpToThreadIdRef.current && !pendingJumpRef.current) {
				const threadId = jumpToThreadIdRef.current;
				jumpToThreadIdRef.current = undefined;
				navToThreadRef.current({ tmid: threadId });
			}
		});
		return () => task.cancel();
	}, [navToThreadRef]);

	useChangedParam(route.params?.jumpToMessageId, id => consumeJumpParamRef.current(id));
	useChangedParam(route.params?.jumpToThreadId, id => navToThreadRef.current({ tmid: id }));

	return { jumpToMessage, cancelJumpToMessage, consumeJumpParam, onThreadMessagesLoaded };
}
