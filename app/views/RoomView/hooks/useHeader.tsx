import { useLayoutEffect } from 'react';
import { PixelRatio, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';

import RoomHeader from '../../../containers/RoomHeader';
import { getRoomTitle, isGroupChat } from '../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { type IOmnichannelSource, type ISubscription, type IVisitor } from '../../../definitions';
import LeftButtons from '../components/LeftButtons';
import RightButtons from '../components/RightButtons';
import { type IRoomViewProps } from '../definitions';
import { useRoomStoreByRid } from '../stores/RoomStore';
import { useGoRoomActionsView } from './useGoRoomActionsView';

export const useHeader = (): void => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const route = useRoute<IRoomViewProps['route']>();
	const rid = route.params?.rid;
	const tmid = route.params?.tmid;
	const roomName = route.params?.name;

	const room = useRoomStoreByRid(rid, s => s.room);
	// last_message re-emits on every incoming message; exclude it so the title effect only re-fires
	// on fields the header actually renders.
	const titleUpdate = useRoomStoreByRid(
		rid,
		useShallow(s => {
			const rest = { ...s.roomUpdate };
			delete rest.lastMessage;
			return rest;
		})
	);
	const roomUserId = useRoomStoreByRid(rid, s => s.roomUserId);
	const goRoomActionsView = useGoRoomActionsView(rid);

	useLayoutEffect(() => {
		if (!rid) {
			const height = 37 * PixelRatio.getFontScale();
			navigation.setOptions({ headerLeft: () => <View style={{ height }} /> });
			return;
		}
		navigation.setOptions({
			headerLeft: () => <LeftButtons rid={rid} tmid={tmid} />,
			headerRight: () => <RightButtons rid={rid} tmid={tmid} />
		});
	}, [rid, tmid, navigation]);

	useLayoutEffect(() => {
		if (!rid) {
			return;
		}

		const prid = room?.prid;
		const isGroupChatConst = isGroupChat(room as ISubscription);
		let title = roomName;
		let parentTitle = '';
		if (!tmid) {
			title = getRoomTitle(room);
		}
		if (tmid) {
			parentTitle = getRoomTitle(room);
		}
		let subtitle: string | undefined;
		let visitor: IVisitor | undefined;
		let sourceType: IOmnichannelSource | undefined;
		if ('id' in room) {
			subtitle = room.topic;
			visitor = room.visitor;
		}

		if ('source' in room) {
			sourceType = room.source;
			visitor = room.visitor;
		}

		const t = room?.t;
		const teamMain = 'teamMain' in room ? room?.teamMain : false;
		const iSubRoom = room as ISubscription;
		navigation.setOptions({
			headerTitle: () => (
				<RoomHeader
					prid={prid}
					tmid={tmid}
					title={title}
					teamMain={teamMain}
					parentTitle={parentTitle}
					subtitle={subtitle}
					type={t}
					roomUserId={roomUserId}
					visitor={visitor}
					isGroupChat={isGroupChatConst}
					onPress={goRoomActionsView}
					testID={`room-view-title-${title}`}
					sourceType={sourceType}
					abacAttributes={iSubRoom.abacAttributes}
					disabled={isInviteSubscription(iSubRoom)}
				/>
			)
		});
	}, [rid, tmid, roomName, room, titleUpdate, roomUserId, navigation, goRoomActionsView]);
};
