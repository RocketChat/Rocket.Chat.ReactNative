import { type NavigatorScreenParams, useNavigation } from '@react-navigation/native';

import { useShallow } from 'zustand/react/shallow';

import { events, logEvent } from '../../../lib/methods/helpers/log';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import type { ISubscription, SubscriptionType, TSubscriptionModel } from '../../../definitions';
import { type TNavigation } from '../../../stacks/stackType';
import { type ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import { type IRoomViewProps, type IRoomViewState } from '../definitions';
import { useRoomStoreByRid } from '../stores/RoomStore';

interface IGoRoomActionsViewState {
	room: IRoomViewState['room'];
	member: IRoomViewState['member'];
	joined: boolean;
	canForwardGuest: boolean;
	canReturnQueue: boolean;
	canViewCannedResponse: boolean;
	canPlaceLivechatOnHold: boolean;
}

export const useGoRoomActionsView = (rid?: string): ((screen?: keyof ModalStackParamList) => void) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const isMasterDetail = useMasterDetail();
	// `t` comes from the store (seeded at mount) rather than route.params, which navigation can wipe.
	const { room, member, joined, canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold } =
		useRoomStoreByRid(
			rid,
			useShallow(
				(s): IGoRoomActionsViewState => ({
					room: s.room,
					member: s.member,
					joined: s.joined,
					canForwardGuest: s.canForwardGuest,
					canReturnQueue: s.canReturnQueue,
					canViewCannedResponse: s.canViewCannedResponse,
					canPlaceLivechatOnHold: s.canPlaceLivechatOnHold
				})
			)
		);
	const t = room.t;

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
