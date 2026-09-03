import { type NavigatorScreenParams, useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';

import { events, logEvent } from '../../../lib/methods/helpers/log';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { useCanReturnQueue } from '../../../ee/omnichannel/hooks/useCanReturnQueue';
import type { ISubscription, SubscriptionType, TSubscriptionModel } from '../../../definitions';
import { type TNavigation } from '../../../stacks/stackType';
import { type ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import { type IRoomViewProps } from '../definitions';
import { useRoomStoreByRid } from '../stores/RoomStore';
import { useCanPlaceLivechatOnHold } from './useCanPlaceLivechatOnHold';

export const useGoRoomActionsView = (rid?: string): ((screen?: keyof ModalStackParamList) => void) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const isMasterDetail = useMasterDetail();
	const { room, member, joined, canForwardGuest, canViewCannedResponse } = useRoomStoreByRid(
		rid,
		useShallow(s => ({
			room: s.room,
			member: s.member,
			joined: s.joined,
			canForwardGuest: s.canForwardGuest,
			canViewCannedResponse: s.canViewCannedResponse
		}))
	);
	const t = room.t;
	const canReturnQueue = useCanReturnQueue(t === 'l');
	const canPlaceLivechatOnHold = useCanPlaceLivechatOnHold(rid);

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
