import { type ComponentType, type ReactElement } from 'react';

import { type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { type RoomStore } from '~/views/RoomView/definitions';
import {
	EMPTY_ACTIONS,
	useOmnichannelActions,
	useRoomActions,
	useRoomHeaderMode,
	useThreadActions
} from '~/views/RoomView/hooks/useRoomHeaderActions';

type TActionsRenderer = ComponentType<{ actions: IHeaderAction[] }>;

interface IRoomHeaderActionsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
	ActionsRenderer: TActionsRenderer;
}

const OmnichannelActions = ({
	rid,
	roomStore,
	ActionsRenderer
}: {
	rid: string;
	roomStore: RoomStore;
	ActionsRenderer: TActionsRenderer;
}) => {
	const actions = useOmnichannelActions(rid, roomStore);
	return <ActionsRenderer actions={actions} />;
};

const ThreadActions = ({ tmid, ActionsRenderer }: { tmid: string; ActionsRenderer: TActionsRenderer }) => {
	const actions = useThreadActions(tmid);
	return <ActionsRenderer actions={actions} />;
};

const RoomActions = ({
	rid,
	roomStore,
	ActionsRenderer
}: {
	rid: string;
	roomStore: RoomStore;
	ActionsRenderer: TActionsRenderer;
}) => {
	const actions = useRoomActions(rid, roomStore);
	return <ActionsRenderer actions={actions} />;
};

export const RoomHeaderActions = ({ rid, tmid, roomStore, ActionsRenderer }: IRoomHeaderActionsProps): ReactElement => {
	const mode = useRoomHeaderMode(rid, tmid, roomStore);

	if (rid && mode === 'omnichannel') {
		return <OmnichannelActions rid={rid} roomStore={roomStore} ActionsRenderer={ActionsRenderer} />;
	}
	if (tmid && mode === 'thread') {
		return <ThreadActions tmid={tmid} ActionsRenderer={ActionsRenderer} />;
	}
	if (rid && mode === 'room') {
		return <RoomActions rid={rid} roomStore={roomStore} ActionsRenderer={ActionsRenderer} />;
	}
	return <ActionsRenderer actions={EMPTY_ACTIONS} />;
};
