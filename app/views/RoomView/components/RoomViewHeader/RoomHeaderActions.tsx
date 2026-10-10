import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import { headerRightActions, type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { type IRoomViewProps, type RoomStore } from '~/views/RoomView/definitions';
import {
	EMPTY_ACTIONS,
	useOmnichannelActions,
	useRoomActions,
	useRoomHeaderMode,
	useThreadActions
} from '~/views/RoomView/hooks/useRoomHeaderActions';

const HeaderRightActions = ({ actions }: { actions: IHeaderAction[] }) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	useLayoutEffect(() => {
		navigation.setOptions(headerRightActions(actions));
	}, [navigation, actions]);

	return null;
};

const OmnichannelActions = ({ rid, roomStore }: { rid: string; roomStore: RoomStore }) => {
	const actions = useOmnichannelActions(rid, roomStore);
	return <HeaderRightActions actions={actions} />;
};

const ThreadActions = ({ tmid }: { tmid: string }) => {
	const actions = useThreadActions(tmid);
	return <HeaderRightActions actions={actions} />;
};

const RoomActions = ({ rid, roomStore }: { rid: string; roomStore: RoomStore }) => {
	const actions = useRoomActions(rid, roomStore);
	return <HeaderRightActions actions={actions} />;
};

export const RoomHeaderActions = ({ rid, tmid, roomStore }: { rid: string; tmid?: string; roomStore: RoomStore }) => {
	const mode = useRoomHeaderMode(tmid, roomStore);

	if (mode === 'omnichannel') {
		return <OmnichannelActions rid={rid} roomStore={roomStore} />;
	}
	if (tmid && mode === 'thread') {
		return <ThreadActions tmid={tmid} />;
	}
	if (mode === 'room') {
		return <RoomActions rid={rid} roomStore={roomStore} />;
	}
	return <HeaderRightActions actions={EMPTY_ACTIONS} />;
};
