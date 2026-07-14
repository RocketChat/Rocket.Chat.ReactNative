import { type NavigatorScreenParams, useNavigation, useRoute } from '@react-navigation/native';

import { events, logEvent } from '../../../lib/methods/helpers/log';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { type ISubscription, SubscriptionType, type TSubscriptionModel } from '../../../definitions';
import { type TNavigation } from '../../../stacks/stackType';
import { type ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import { type IRoomViewProps } from '../definitions';
import { useRoomStoreByRid } from '../stores/RoomStore';

export const useGoRoomActionsView = (rid?: string): ((screen?: keyof ModalStackParamList) => void) => {
	'use memo';

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
		if (isMasterDetail) {
			// @ts-ignore — navigation types expect a literal screen name
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: rid as string,
					t: t as SubscriptionType,
					room: room as ISubscription,
					member,
					showCloseModal: !!screen,
					// @ts-ignore
					joined,
					omnichannelPermissions
				}
			} as NavigatorScreenParams<ModalStackParamList & TNavigation>);
		} else if (rid && t) {
			navigation.push('RoomActionsView', {
				rid,
				t: t as SubscriptionType,
				room: room as TSubscriptionModel,
				member,
				joined,
				omnichannelPermissions
			});
		}
	};
};
