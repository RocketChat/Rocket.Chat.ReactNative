import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useStore } from 'zustand';

import { type IHeaderAction, nativeHeaderItems } from '~/lib/methods/helpers/navigation/headerActions';
import { type IRoomViewProps, type RoomStore } from '~/views/RoomView/definitions';
import { useGoRoomActionsView } from '~/views/RoomView/hooks/useGoRoomActionsView';
import { useHeaderFields } from '~/views/RoomView/hooks/useHeaderFields';
import { useNativeBackButton } from '~/views/RoomView/hooks/useNativeBackButton';
import { useNativeRoomHeader } from '~/views/RoomView/hooks/useNativeRoomHeader';
import LeftButtons from '../LeftButtons';

export const NativeRoomTitle = ({
	tmid,
	threadName,
	roomStore
}: {
	tmid?: string;
	threadName?: string;
	roomStore: RoomStore;
}) => {
	const fields = useHeaderFields(roomStore, tmid, threadName);
	const roomUserId = useStore(roomStore, s => s.roomUserId);
	const goRoomActionsView = useGoRoomActionsView(roomStore);
	useNativeRoomHeader(fields, tmid, roomUserId, goRoomActionsView);
	return null;
};

export const NativeBackButton = ({ rid }: { rid: string }) => {
	useNativeBackButton(rid);
	return null;
};

export const NativeAvatarItem = ({ rid, roomStore }: { rid: string; roomStore: RoomStore }) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	useLayoutEffect(() => {
		navigation.setOptions({
			unstable_headerLeftItems: () => [
				{ type: 'custom', element: <LeftButtons rid={rid} roomStore={roomStore} />, hidesSharedBackground: true }
			]
		});
	}, [navigation, rid, roomStore]);

	return null;
};

export const NativeRightItems = ({ actions }: { actions: IHeaderAction[] }) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	useLayoutEffect(() => {
		navigation.setOptions({ unstable_headerRightItems: () => nativeHeaderItems(actions) });
	}, [navigation, actions]);

	return null;
};
