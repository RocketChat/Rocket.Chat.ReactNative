import { useLayoutEffect } from 'react';
import { PixelRatio, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from 'zustand';

import RoomHeader from '../../../containers/RoomHeader';
import { getRoomTitle, isGroupChat } from '../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { type IOmnichannelSource, type ISubscription, type IVisitor } from '../../../definitions';
import LeftButtons from '../components/LeftButtons';
import RightButtons from '../components/RightButtons/RightButtons';
import { type IRoomViewProps } from '../definitions';
import { type RoomStore } from '../definitions';
import { isSubscriptionModel } from '../../../definitions/TRoom';
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

			const subscription = isSubscriptionModel(room) ? room : undefined;

			let subtitle: string | undefined;
			let visitor: IVisitor | undefined;
			let sourceType: IOmnichannelSource | undefined;
			if (isSubscriptionModel(room)) {
				subtitle = room.topic;
				visitor = room.visitor;
				sourceType = room.source;
			}

			return {
				prid: room?.prid,
				title,
				teamMain: isSubscriptionModel(room) ? !!room?.teamMain : false,
				parentTitle,
				subtitle,
				type: room?.t,
				visitor,
				isGroupChat: subscription ? isGroupChat(subscription) : false,
				sourceType,
				abacAttributes: subscription?.abacAttributes,
				disabled: subscription ? isInviteSubscription(subscription) : false
			};
		})
	);
	const roomUserId = useStore(roomStore, s => s.roomUserId);
	const goRoomActionsView = useGoRoomActionsView(roomStore);

	useLayoutEffect(() => {
		if (!rid) {
			const height = 37 * PixelRatio.getFontScale();
			navigation.setOptions({ headerLeft: () => <View style={{ height }} /> });
			return;
		}
		navigation.setOptions({
			headerLeft: () => <LeftButtons rid={rid} tmid={tmid} roomStore={roomStore} />,
			headerRight: () => <RightButtons rid={rid} tmid={tmid} roomStore={roomStore} />
		});
	}, [rid, tmid, navigation, roomStore]);

	useLayoutEffect(() => {
		if (!rid) {
			return;
		}

		navigation.setOptions({
			headerTitle: () => (
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
			)
		});
	}, [rid, tmid, headerFields, roomUserId, navigation, goRoomActionsView]);
};
