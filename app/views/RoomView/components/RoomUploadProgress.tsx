import { useWindowDimensions } from 'react-native';

import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { useRoomStore } from '../stores/RoomStoreContext';
import UploadProgress from './UploadProgress';

export const RoomUploadProgress = () => {
	const rid = useRoomStore(s => s.room.rid);
	const user = useAppSelector(getUserSelector);
	const baseUrl = useAppSelector(state => state.server.server);
	const { width } = useWindowDimensions();

	return <UploadProgress rid={rid} user={user} baseUrl={baseUrl} width={width} />;
};
