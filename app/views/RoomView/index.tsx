import { useEffect, useState } from 'react';

import { type IRoomScreenInput, type IRoomViewProps, type RoomStore } from './definitions';
import { EmptyRoomView } from './components/EmptyRoomView';
import { RoomViewContent } from './components/RoomViewContent/RoomViewContent';
import { RoomViewHeader } from './components/RoomViewHeader/RoomViewHeader';
import { parseRoomRoute } from './services/parseRoomRoute';
import { createRoomStore, observeRoom } from './stores/RoomStore';

const OpenRoomView = ({ route, navigation, mountedRoute }: IRoomViewProps & { mountedRoute: IRoomScreenInput }) => {
	const { rid, t, tmid, name, initialRoom, roomUserId } = mountedRoute;

	const [roomStore] = useState<RoomStore>(() => createRoomStore({ rid, initialRoom, roomUserId }));
	const [ready, setReady] = useState(false);
	useEffect(() => observeRoom(rid, roomStore, () => setReady(true)), [rid, roomStore]);

	return (
		<>
			<RoomViewHeader rid={rid} tmid={tmid} name={name} roomStore={roomStore} />
			<RoomViewContent route={route} navigation={navigation} rid={rid} t={t} tmid={tmid} roomStore={roomStore} ready={ready} />
		</>
	);
};

const RoomView = ({ route, navigation }: IRoomViewProps) => {
	const [mountedRoute] = useState(() => (route.params ? parseRoomRoute(route.params) : null));

	if (!mountedRoute) {
		return <EmptyRoomView />;
	}
	return <OpenRoomView route={route} navigation={navigation} mountedRoute={mountedRoute} />;
};

export default RoomView;
