import { type ComponentProps, useLayoutEffect } from 'react';
import { PixelRatio, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';

import RoomHeader from '../../../containers/RoomHeader';
import { getRoomTitle, isGroupChat } from '../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { type IOmnichannelSource, type ISubscription, type IVisitor } from '../../../definitions';
import LeftButtons from '../components/LeftButtons';
import RightButtons from '../components/RightButtons';
import { type IRoomViewProps, type IRoomViewState } from '../definitions';
import { useRoomStoreByRid } from '../stores/RoomStore';
import { useGoRoomActionsView } from './useGoRoomActionsView';

interface IUseHeaderParams {
	rid?: string;
	tmid?: string;
	/** Thread name on a thread; only read when `tmid` is set, since the room title is derived from the room. */
	name?: string;
}

interface IGetRoomHeaderPropsParams {
	room: IRoomViewState['room'];
	tmid?: string;
	roomName?: string;
	roomUserId?: string | null;
	onPress: () => void;
}

const getRoomHeaderProps = ({
	room,
	tmid,
	roomName,
	roomUserId,
	onPress
}: IGetRoomHeaderPropsParams): ComponentProps<typeof RoomHeader> => {
	const title = tmid ? roomName : getRoomTitle(room);
	const parentTitle = tmid ? getRoomTitle(room) : '';

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

	const subscription = room as ISubscription;
	return {
		prid: room?.prid,
		tmid,
		title,
		teamMain: 'teamMain' in room ? room?.teamMain : false,
		parentTitle,
		subtitle,
		type: room?.t,
		roomUserId,
		visitor,
		isGroupChat: isGroupChat(subscription),
		onPress,
		testID: `room-view-title-${title}`,
		sourceType,
		abacAttributes: subscription.abacAttributes,
		disabled: isInviteSubscription(subscription)
	};
};

// rid/tmid/name come from the screen's mount-time snapshot: route.params can be wiped to undefined
// while this RoomView is retained below the stack top, which would break the header permanently.
export const useHeader = ({ rid, tmid, name: roomName }: IUseHeaderParams): void => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

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

		const headerProps = getRoomHeaderProps({ room, tmid, roomName, roomUserId, onPress: goRoomActionsView });
		navigation.setOptions({ headerTitle: () => <RoomHeader {...headerProps} /> });
	}, [rid, tmid, roomName, room, titleUpdate, roomUserId, navigation, goRoomActionsView]);
};
