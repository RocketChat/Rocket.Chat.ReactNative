import { useStore } from 'zustand';

import { type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { type RoomStore } from '~/views/RoomView/definitions';
import { useGoRoomActionsView } from '~/views/RoomView/hooks/useGoRoomActionsView';
import { useHeaderFields } from '~/views/RoomView/hooks/useHeaderFields';
import { useNativeAvatarItem, useNativeRightItems } from '~/views/RoomView/hooks/useNativeHeaderItems';
import { useNativeBackButton } from '~/views/RoomView/hooks/useNativeBackButton';
import { useNativeRoomHeader } from '~/views/RoomView/hooks/useNativeRoomHeader';

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
	useNativeAvatarItem(rid, roomStore);
	return null;
};

export const NativeRightItems = ({ actions }: { actions: IHeaderAction[] }) => {
	useNativeRightItems(actions);
	return null;
};
