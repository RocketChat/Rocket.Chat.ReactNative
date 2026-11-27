import { useEffect, useState } from 'react';

import { type IRoomViewProps } from './definitions';
import { RoomViewContent } from './components/RoomViewContent/RoomViewContent';
import { RoomViewHeader } from './components/RoomViewHeader/RoomViewHeader';
import { parseRoomRoute } from './services/parseRoomRoute';
import { createRoomStore, observeRoom } from './stores/RoomStore';
import { type RoomStore } from './definitions';
import { FocusedSharedTransitionBoundary } from '~/containers/FocusedSharedTransitionBoundary';
import { useUsesInvertedScrollView } from './List/hooks/useUsesInvertedScrollView';

const RoomView = ({ route, navigation }: IRoomViewProps) => {
	const [mountedRouteParams] = useState(() => parseRoomRoute(route.params));
	const { rid, t, tmid, name, initialRoom, roomUserId } = mountedRouteParams;

	const [roomStore] = useState<RoomStore>(() => createRoomStore({ rid, initialRoom, roomUserId }));
	const [ready, setReady] = useState(false);
	useEffect(() => observeRoom(rid, roomStore, () => setReady(true)), [rid, roomStore]);
	const usesInvertedScrollView = useUsesInvertedScrollView();

	return (
		<FocusedSharedTransitionBoundary isEnabled={!usesInvertedScrollView}>
			<RoomViewHeader rid={rid} tmid={tmid} name={name} roomStore={roomStore} />
			<RoomViewContent route={route} navigation={navigation} rid={rid} t={t} tmid={tmid} roomStore={roomStore} ready={ready} />
		</FocusedSharedTransitionBoundary>
	);
};

export default RoomView;
