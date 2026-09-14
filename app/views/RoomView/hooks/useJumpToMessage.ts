import { useEffect, useRef } from 'react';
import parse from 'url-parse';
import { useNavigation, useRoute } from '@react-navigation/native';

import { sendLoadingEvent } from '../../../containers/Loading';
import I18n from '../../../i18n';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { useDebounce } from '../../../lib/methods/helpers';
import { useLiveRef } from '../../../lib/hooks/useLiveRef';
import log from '../../../lib/methods/helpers/log';
import { type TAnyMessageModel } from '../../../definitions';
import { loadSurroundingMessages } from '../../../lib/methods/loadSurroundingMessages';
import {
	type IRoomViewProps,
	type IUseJumpToMessageParams,
	type IUseJumpToMessageResult,
	type TGetMessageInfoResult
} from '../definitions';
import getLocalAnchorTs from '../services/getLocalAnchor';
import getMessageInfo from '../services/getMessageInfo';
import { openRoom } from '../services/openRoom';
import { openThread, type TOpenThreadTarget } from '../services/openThread';
import { resolveJumpAnchor } from '../services/resolveJumpAnchor';

const FABRIC_COMMIT_DELAY = 100;

const waitForFabricCommit = (): Promise<void> =>
	new Promise(resolve => {
		setTimeout(resolve, FABRIC_COMMIT_DELAY);
	});

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

interface IUseJumpRouteParams {
	navigation: IRoomViewProps['navigation'];
	route: IRoomViewProps['route'];
	tmid?: string;
	jumpToMessage: (messageId: string) => void;
	openThreadById: (tmid: string) => void;
}

function useJumpRouteParams({ navigation, route, tmid, jumpToMessage, openThreadById }: IUseJumpRouteParams): () => void {
	const pendingJumpRef = useRef<string | undefined>(route.params?.jumpToMessageId);
	const jumpToThreadIdRef = useRef<string | undefined>(route.params?.jumpToThreadId);
	const loadedThreadRef = useRef<string | undefined>(undefined);

	const consumeJumpParam = (messageId: string) => {
		pendingJumpRef.current = undefined;
		jumpToMessage(messageId);
		navigation.setParams({ jumpToMessageId: undefined });
	};

	const onThreadMessagesLoaded = () => {
		loadedThreadRef.current = tmid;
		if (pendingJumpRef.current) {
			consumeJumpParam(pendingJumpRef.current);
		}
	};

	const onJumpParamChanged = (messageId: string) => {
		if (!tmid || loadedThreadRef.current === tmid) {
			consumeJumpParam(messageId);
		} else {
			pendingJumpRef.current = messageId;
		}
	};

	const consumeJumpParamRef = useLiveRef(consumeJumpParam);
	const openThreadByIdRef = useLiveRef(openThreadById);

	useEffect(() => {
		if (pendingJumpRef.current && !tmid) {
			consumeJumpParamRef.current(pendingJumpRef.current);
		}
		if (jumpToThreadIdRef.current && !pendingJumpRef.current) {
			const threadId = jumpToThreadIdRef.current;
			jumpToThreadIdRef.current = undefined;
			openThreadByIdRef.current(threadId);
		}
	}, []);

	useChangedParam(route.params?.jumpToMessageId, onJumpParamChanged);
	useChangedParam(route.params?.jumpToThreadId, openThreadById);

	return onThreadMessagesLoaded;
}

export function useJumpToMessage({
	rid,
	tmid,
	t,
	isMasterDetail,
	listContainerRef,
	roomUserIdRef
}: IUseJumpToMessageParams): IUseJumpToMessageResult {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const route = useRoute<IRoomViewProps['route']>();
	const jumpGenerationRef = useRef(0);

	const isCurrentJump = (generation: number): boolean => jumpGenerationRef.current === generation;

	const cancelJumpToMessage = (): void => {
		jumpGenerationRef.current += 1;
		listContainerRef.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	const openThreadFromHere = (message: TOpenThreadTarget) =>
		openThread(message, { navigation, rid, roomUserId: roomUserIdRef.current, cancelJumpToMessage });

	const executeJump = async (message: TGetMessageInfoResult, generation: number): Promise<boolean> => {
		const inThisThread = !!message.tmid && message.tmid === tmid;
		const inThisRoom = !message.tmid && message.rid === rid;
		if (!inThisThread && !inThisRoom) {
			if (message.rid !== rid) {
				await openRoom(message, { isMasterDetail });
			} else {
				await openThreadFromHere(message);
			}
			return false;
		}
		if (inThisRoom && t === 'thread' && message.id !== tmid) {
			await openRoom(message, { isMasterDetail });
			return false;
		}
		const inWindow = listContainerRef.current?.isMessageInWindow(message.id) ?? false;
		const highTsMs = await resolveJumpAnchor(rid, message, inWindow, { loadSurroundingMessages, getLocalAnchorTs });
		if (!isCurrentJump(generation)) return false;
		await waitForFabricCommit();
		if (!isCurrentJump(generation)) return false;
		await listContainerRef.current?.jumpToMessage(message.id, highTsMs);
		return true;
	};

	const jumpToMessage = async (messageId: string, isFromReply?: boolean): Promise<void> => {
		jumpGenerationRef.current += 1;
		const generation = jumpGenerationRef.current;
		try {
			sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessage });
			const message = await getMessageInfo(messageId);
			if (!isCurrentJump(generation)) return;
			if (!message) {
				cancelJumpToMessage();
				return;
			}

			const settledLocally = await executeJump(message, generation);
			if (settledLocally) {
				sendLoadingEvent({ visible: false });
			}
		} catch (error: any) {
			if (!isCurrentJump(generation)) return;
			if (isFromReply && error.data?.errorType === 'error-not-allowed') {
				showErrorAlert(I18n.t('The_room_does_not_exist'), I18n.t('Room_not_found'));
			} else {
				log(error);
			}
			cancelJumpToMessage();
		}
	};

	const onThreadMessagesLoaded = useJumpRouteParams({
		navigation,
		route,
		tmid,
		jumpToMessage,
		openThreadById: id => openThreadFromHere({ tmid: id })
	});

	const onThreadPress = useDebounce((message: TAnyMessageModel) => openThreadFromHere(message), 1000, {
		leading: true,
		trailing: false
	});

	const jumpToMessageByUrl = async (messageUrl?: string, isFromReply?: boolean) => {
		if (!messageUrl) {
			return;
		}
		try {
			const parsedUrl = parse(messageUrl, true);
			const messageId = parsedUrl.query.msg;
			if (messageId) {
				await jumpToMessage(messageId, isFromReply);
			}
		} catch (e) {
			log(e);
		}
	};

	return { onThreadMessagesLoaded, onThreadPress, jumpToMessageByUrl };
}
