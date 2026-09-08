import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import parse from 'url-parse';
import { useNavigation, useRoute } from '@react-navigation/native';

import { sendLoadingEvent } from '../../../containers/Loading';
import I18n from '../../../i18n';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { useDebounce } from '../../../lib/methods/helpers';
import { useLiveRef } from '../../../lib/hooks/useLiveRef';
import log from '../../../lib/methods/helpers/log';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../lib/constants/keys';
import { SubscriptionType, type TAnyMessageModel } from '../../../definitions';
import { loadSurroundingMessages } from '../../../lib/methods/loadSurroundingMessages';
import {
	type IRoomViewProps,
	type IUseRoomNavigationParams,
	type IUseRoomNavigationResult,
	type TGetMessageInfoResult
} from '../definitions';
import getLocalAnchorTs from '../services/getLocalAnchor';
import getMessageInfo from '../services/getMessageInfo';
import { fetchThreadName } from '../services/fetchThreadName';
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

export function useRoomNavigation({
	rid,
	tmid,
	t,
	isMasterDetail,
	listContainerRef,
	roomUserIdRef
}: IUseRoomNavigationParams): IUseRoomNavigationResult {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const route = useRoute<IRoomViewProps['route']>();
	const pendingJumpRef = useRef<string | undefined>(route.params?.jumpToMessageId);
	const jumpToThreadIdRef = useRef<string | undefined>(route.params?.jumpToThreadId);
	const loadedThreadRef = useRef<string | undefined>(undefined);
	const jumpGenerationRef = useRef(0);

	const isCurrentJump = (generation: number): boolean => jumpGenerationRef.current === generation;

	const cancelJumpToMessage = (): void => {
		jumpGenerationRef.current += 1;
		listContainerRef.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	const navToRoom = async (message: TGetMessageInfoResult) => {
		if (!message.rid) return;
		const roomInfo = await getRoomInfo(message.rid);
		return goRoom({
			item: roomInfo as TGoRoomItem,
			isMasterDetail,
			jumpToMessageId: message.id
		});
	};

	const navToThread = async (message: TAnyMessageModel | { tmid: string } | TGetMessageInfoResult) => {
		if (!rid) {
			return;
		}
		if (!message.tmid) {
			if ('tlm' in message) {
				return navigation.push('RoomView', {
					rid,
					tmid: message.id,
					name: makeThreadName(message),
					t: SubscriptionType.THREAD,
					roomUserId: roomUserIdRef.current
				});
			}
			return;
		}

		const roomUserId = roomUserIdRef.current;
		const jumpToMessageId = 'id' in message ? message.id : '';
		const knownName = 'id' in message && 'tmsg' in message ? (message.tmsg ?? '') : '';
		let cancelled = false;
		const cancelThread = () => {
			cancelled = true;
			cancelJumpToMessage();
		};
		sendLoadingEvent({ visible: true, onCancel: cancelThread });
		let threadName: string | undefined;
		try {
			threadName = await fetchThreadName(rid, message.tmid, jumpToMessageId, knownName);
		} catch (error) {
			sendLoadingEvent({ visible: false });
			throw error;
		}
		if (!threadName || cancelled) {
			sendLoadingEvent({ visible: false });
			return;
		}
		const isUndecryptable =
			'id' in message && 't' in message && message.t === E2E_MESSAGE_TYPE && 'e2e' in message && message.e2e !== E2E_STATUS.DONE;
		if (!jumpToMessageId) {
			setTimeout(() => sendLoadingEvent({ visible: false }), 300);
		}
		return navigation.push('RoomView', {
			rid,
			tmid: message.tmid,
			name: isUndecryptable ? I18n.t('Encrypted_message') : threadName,
			t: SubscriptionType.THREAD,
			roomUserId,
			jumpToMessageId
		});
	};

	const executeJump = async (message: TGetMessageInfoResult, generation: number): Promise<boolean> => {
		const inThisThread = !!message.tmid && message.tmid === tmid;
		const inThisRoom = !message.tmid && message.rid === rid;
		if (!inThisThread && !inThisRoom) {
			if (message.rid !== rid) {
				await navToRoom(message);
			} else {
				await navToThread(message);
			}
			return false;
		}
		if (inThisRoom && t === 'thread' && message.id !== tmid) {
			await navToRoom(message);
			return false;
		}
		const inWindow = listContainerRef.current?.isMessageInWindow(message.id) ?? false;
		const highTsMs = await resolveJumpAnchor(
			rid,
			{ id: message.id, tmid: message.tmid, ts: message.ts, fromServer: message.fromServer },
			inWindow,
			{ loadSurroundingMessages, getLocalAnchorTs }
		);
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
	const navToThreadRef = useLiveRef(navToThread);

	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => {
			if (pendingJumpRef.current && !tmid) {
				consumeJumpParamRef.current(pendingJumpRef.current);
			}
		});
		return () => task.cancel();
	}, [tmid, consumeJumpParamRef]);

	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => {
			if (jumpToThreadIdRef.current && !pendingJumpRef.current) {
				const threadId = jumpToThreadIdRef.current;
				jumpToThreadIdRef.current = undefined;
				navToThreadRef.current({ tmid: threadId });
			}
		});
		return () => task.cancel();
	}, [navToThreadRef]);

	useChangedParam(route.params?.jumpToMessageId, onJumpParamChanged);
	useChangedParam(route.params?.jumpToThreadId, id => navToThread({ tmid: id }));

	const onThreadPress = useDebounce((message: TAnyMessageModel) => navToThread(message), 1000, {
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
