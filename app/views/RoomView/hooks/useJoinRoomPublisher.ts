import { type RefObject, useEffect } from 'react';

import { takeInquiry, takeResume } from '../../../ee/omnichannel/lib';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { joinRoom as joinRoomService } from '../../../lib/services/restApi';
import { type IJoinCode, type IRoomViewState, type IUseJoinRoomPublisherParams } from '../definitions';

interface IJoinRoomContext {
	room: IRoomViewState['room'];
	isOmnichannel: boolean;
	serverVersion?: string | null;
	t?: string;
	joinCodeRef: RefObject<IJoinCode | null>;
	onJoin: () => void;
}

const joinRoomImpl = async ({ room, isOmnichannel, serverVersion, t, joinCodeRef, onJoin }: IJoinRoomContext) => {
	logEvent(events.ROOM_JOIN);
	try {
		if (isOmnichannel) {
			if ('_id' in room) {
				await takeInquiry(room._id, serverVersion as string);
			}
			onJoin();
		} else {
			const { joinCodeRequired, rid: roomRid } = room;
			if (joinCodeRequired) {
				joinCodeRef.current?.show();
			} else {
				await joinRoomService(roomRid, null, t as any);
				onJoin();
			}
		}
	} catch (e) {
		log(e);
	}
};

const resumeRoomImpl = async ({ room, isOmnichannel, onJoin }: Pick<IJoinRoomContext, 'room' | 'isOmnichannel' | 'onJoin'>) => {
	logEvent(events.ROOM_RESUME);
	try {
		if (isOmnichannel) {
			if ('rid' in room) {
				await takeResume(room.rid);
			}
			onJoin();
		}
	} catch (e) {
		log(e);
	}
};

export function useJoinRoomPublisher({
	roomStore,
	room,
	isOmnichannel,
	serverVersion,
	t,
	joinCodeRef
}: IUseJoinRoomPublisherParams): void {
	'use memo';

	// The published closures are rebuilt from the same module impls the returned handlers use; the
	// inline onJoin keeps the dep array to values only (a component-scope fn would warn).
	useEffect(() => {
		const onStoreJoin = () => {
			roomStore.getState().join();
		};
		roomStore.setState({
			joinRoom: () => joinRoomImpl({ room, isOmnichannel, serverVersion, t, joinCodeRef, onJoin: onStoreJoin }),
			resumeRoom: () => resumeRoomImpl({ room, isOmnichannel, onJoin: onStoreJoin })
		});
	}, [roomStore, room, isOmnichannel, serverVersion, t, joinCodeRef]);
}
