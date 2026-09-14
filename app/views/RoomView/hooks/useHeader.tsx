import { useLayoutEffect } from 'react';
import { Platform, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from 'zustand';

import RoomHeader from '~/containers/RoomHeader';
import { getRoomTitle, isGroupChat, isIOS } from '~/lib/methods/helpers';
import { isInviteSubscription } from '~/lib/methods/isInviteSubscription';
import { type IOmnichannelSource, type ISubscription, type IVisitor } from '~/definitions';
import LeftButtons from '../components/LeftButtons';
import { headerItems, type HeaderAction } from '~/lib/methods/helpers/navigation';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import i18n from '~/i18n';
import { useUnreadsCount } from './useUnreadsCount';
import { type IRoomViewProps } from '../definitions';
import { type RoomStore } from '../definitions';
import { fromSubscription } from '../stores/RoomStoreContext';
import { useGoRoomActionsView } from './useGoRoomActionsView';

interface IUseHeaderParams {
	rid?: string;
	tmid?: string;
	/** Thread name on a thread; only read when `tmid` is set, since the room title is derived from the room. */
	name?: string;
	roomStore: RoomStore;
}

interface IHeaderFields {
	prid?: string;
	title: string;
	parentTitle: string;
	teamMain: boolean;
	subtitle?: string;
	type: string;
	visitor?: IVisitor;
	isGroupChat: boolean;
	sourceType?: IOmnichannelSource;
	abacAttributes: ISubscription['abacAttributes'];
	disabled: boolean;
}

// rid/tmid/name come from the screen's mount-time snapshot: route.params can be wiped to undefined
// while this RoomView is retained below the stack top, which would break the header permanently.
export const useHeader = ({ rid, tmid, name: roomName, roomStore }: IUseHeaderParams): void => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	const headerFields = useStore(
		roomStore,
		useShallow((s): IHeaderFields => {
			const room = s.room;
			const title = tmid ? (roomName ?? '') : getRoomTitle(room);
			const parentTitle = tmid ? getRoomTitle(room) : '';

			return {
				prid: room?.prid,
				title,
				teamMain: fromSubscription(r => !!r.teamMain, false)(s),
				parentTitle,
				subtitle: fromSubscription(r => r.topic, undefined)(s),
				type: room?.t,
				visitor: fromSubscription(r => r.visitor, undefined)(s),
				isGroupChat: fromSubscription(r => isGroupChat(r), false)(s),
				sourceType: fromSubscription(r => r.source, undefined)(s),
				abacAttributes: fromSubscription(r => r.abacAttributes, undefined)(s),
				disabled: fromSubscription(r => isInviteSubscription(r), false)(s)
			};
		})
	);
	const isMasterDetail = useMasterDetail();
	const unreadsCount = useUnreadsCount(rid);
	const roomUserId = useStore(roomStore, s => s.roomUserId);
	const goRoomActionsView = useGoRoomActionsView(roomStore);

	useLayoutEffect(() => {
		if (!rid) {
			navigation.setOptions(headerItems({ left: [], right: [] }));
			return;
		}
		const leftElement = <LeftButtons rid={rid} tmid={tmid} roomStore={roomStore} />;
		const leftActions: HeaderAction[] =
			(!isMasterDetail || tmid) && !(isIOS && Number.parseInt(String(Platform.Version), 10) < 26 && unreadsCount)
				? [
						{
							type: 'button',
							label: i18n.t('Back'),
							iconName: 'chevron-left',
							onPress: () => navigation.goBack(),
							badge: unreadsCount ? { value: unreadsCount > 99 ? '+99' : unreadsCount } : undefined,
							androidElement: leftElement
						}
					]
				: [{ type: 'custom', element: leftElement }];
		navigation.setOptions(headerItems({ left: leftActions }));
	}, [rid, tmid, navigation, roomStore, isMasterDetail, unreadsCount]);

	useLayoutEffect(() => {
		if (!rid) {
			return;
		}

		navigation.setOptions({
			title: headerFields.title,
			headerTitle: () => (
				<View style={isIOS ? { width: '100%', overflow: 'hidden' } : { flex: 1 }}>
					<RoomHeader
						prid={headerFields.prid}
						tmid={tmid}
						title={headerFields.title}
						teamMain={headerFields.teamMain}
						parentTitle={headerFields.parentTitle}
						subtitle={headerFields.subtitle}
						type={headerFields.type}
						roomUserId={roomUserId}
						visitor={headerFields.visitor}
						isGroupChat={headerFields.isGroupChat}
						onPress={goRoomActionsView}
						testID={`room-view-title-${headerFields.title}`}
						sourceType={headerFields.sourceType}
						abacAttributes={headerFields.abacAttributes}
						disabled={headerFields.disabled}
					/>
				</View>
			)
		});
	}, [rid, tmid, headerFields, roomUserId, navigation, goRoomActionsView]);
};
