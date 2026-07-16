import { useEffect } from 'react';

import I18n from '../../../i18n';
import { getRoomTitle } from '../../../lib/methods/helpers';
import EventEmitter from '../../../lib/methods/helpers/events';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import Navigation from '../../../lib/navigation/appNavigation';
import { peekRoomStore } from '../stores/RoomStore';

const handleRoomRemoved = (removedRid: string, rid: string | undefined, isMasterDetail: boolean) => {
	if (removedRid === rid) {
		Navigation.popToTop(isMasterDetail);
		const currentRoom = peekRoomStore(rid).getState().room;
		if (currentRoom.t !== 'l') {
			showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: getRoomTitle(currentRoom) }), I18n.t('Oops'));
		}
	}
};

export function useRoomRemoved(rid: string | undefined, isMasterDetail: boolean): void {
	'use memo';

	useEffect(() => {
		const onRoomRemoved = ({ rid: removedRid }: { rid: string }) => handleRoomRemoved(removedRid, rid, isMasterDetail);
		EventEmitter.addEventListener('ROOM_REMOVED', onRoomRemoved);
		return () => EventEmitter.removeListener('ROOM_REMOVED', onRoomRemoved);
	}, [rid, isMasterDetail]);
}
