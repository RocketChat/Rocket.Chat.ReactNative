import { type NavigatorScreenParams, useNavigation, useRoute } from '@react-navigation/native';

import { events, logEvent } from '../../../lib/methods/helpers/log';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import type { ISubscription, SubscriptionType, TSubscriptionModel } from '../../../definitions';
import { type TNavigation } from '../../../stacks/stackType';
import { type ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import { type IRoomViewProps } from '../definitions';
import { useRoomStoreByRid } from '../stores/RoomStore';

export const useGoRoomActionsView = (rid?: string): ((screen?: keyof ModalStackParamList) => void) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const route = useRoute<IRoomViewProps['route']>();
	const t = route.params?.t;
	const isMasterDetail = useMasterDetail();
	const room = useRoomStoreByRid(rid, s => s.room);
	const member = useRoomStoreByRid(rid, s => s.member);
	const joined = useRoomStoreByRid(rid, s => s.joined);
	const canForwardGuest = useRoomStoreByRid(rid, s => s.canForwardGuest);
	const canReturnQueue = useRoomStoreByRid(rid, s => s.canReturnQueue);
	const canViewCannedResponse = useRoomStoreByRid(rid, s => s.canViewCannedResponse);
	const canPlaceLivechatOnHold = useRoomStoreByRid(rid, s => s.canPlaceLivechatOnHold);

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
