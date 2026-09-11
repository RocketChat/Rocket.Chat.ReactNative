import { RoomBackground } from '../../components/RoomBackground';

const EmptyRoom = ({ length, rid }: { length: number; rid: string }) => {
	if (length === 0 || !rid) {
		return <RoomBackground />;
	}
	return null;
};

export default EmptyRoom;
