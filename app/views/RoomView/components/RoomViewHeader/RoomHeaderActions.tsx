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

type THeaderActionsSink = ComponentType<{ actions: IHeaderAction[] }>;

interface IRoomHeaderActionsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
	Sink: THeaderActionsSink;
}

const OmnichannelActions = ({ rid, roomStore, Sink }: { rid: string; roomStore: RoomStore; Sink: THeaderActionsSink }) => {
	const actions = useOmnichannelActions(rid, roomStore);
	return <Sink actions={actions} />;
};

const ThreadActions = ({ tmid, Sink }: { tmid: string; Sink: THeaderActionsSink }) => {
	const actions = useThreadActions(tmid);
	return <Sink actions={actions} />;
};

const RoomActions = ({ rid, roomStore, Sink }: { rid: string; roomStore: RoomStore; Sink: THeaderActionsSink }) => {
	const actions = useRoomActions(rid, roomStore);
	return <Sink actions={actions} />;
};

export const RoomHeaderActions = ({ rid, tmid, roomStore, Sink }: IRoomHeaderActionsProps): ReactElement => {
	const mode = useRoomHeaderMode(rid, tmid, roomStore);

	if (rid && mode === 'omnichannel') {
		return <OmnichannelActions rid={rid} roomStore={roomStore} Sink={Sink} />;
	}
	if (tmid && mode === 'thread') {
		return <ThreadActions tmid={tmid} Sink={Sink} />;
	}
	if (rid && mode === 'room') {
		return <RoomActions rid={rid} roomStore={roomStore} Sink={Sink} />;
	}
	return <Sink actions={EMPTY_ACTIONS} />;
};
