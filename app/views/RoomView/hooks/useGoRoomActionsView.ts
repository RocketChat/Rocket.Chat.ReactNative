import { type NavigatorScreenParams, useNavigation } from '@react-navigation/native';

import { events, logEvent } from '../../../lib/methods/helpers/log';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { useCanReturnQueue } from '../../../ee/omnichannel/hooks/useCanReturnQueue';
import type { ISubscription, SubscriptionType, TSubscriptionModel } from '../../../definitions';
import { type TNavigation } from '../../../stacks/stackType';
import { type ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import { type IRoomViewProps } from '../definitions';
import { useStore } from 'zustand';
import { type RoomStore } from '../definitions';
import { useCanPlaceLivechatOnHold } from './useCanPlaceLivechatOnHold';

export const useGoRoomActionsView = (roomStore: RoomStore): ((screen?: keyof ModalStackParamList) => void) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const isMasterDetail = useMasterDetail();
	// `t` comes from the store (seeded at mount) rather than route.params, which navigation can wipe.
	const rid = useStore(roomStore, s => s.room.rid);
	const room = useStore(roomStore, s => s.room);
	const t = room.t;
	const member = useStore(roomStore, s => s.member);
	const joined = useStore(roomStore, s => s.joined);
	const canForwardGuest = useStore(roomStore, s => s.canForwardGuest);
	const canViewCannedResponse = useStore(roomStore, s => s.canViewCannedResponse);
	const canReturnQueue = useCanReturnQueue(t === 'l');
	const canPlaceLivechatOnHold = useCanPlaceLivechatOnHold(roomStore);

	const omnichannelPermissions = { canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold };

	return (screen?: keyof ModalStackParamList) => {
		logEvent(events.ROOM_GO_RA);
		const params = {
			rid: rid as string,
			t: t as SubscriptionType,
			member,
			joined,
			omnichannelPermissions
		};
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: { ...params, room: room as ISubscription, showCloseModal: !!screen }
			} as NavigatorScreenParams<ModalStackParamList & TNavigation>);
		} else if (rid && t) {
			navigation.push('RoomActionsView', { ...params, room: room as TSubscriptionModel });
		}
	};
};
