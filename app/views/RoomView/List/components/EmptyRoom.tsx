import { RoomBackground } from '~/views/RoomView/components/RoomBackground';

const EmptyRoom = ({ length }: { length: number }) => {
	if (length === 0) {
		return <RoomBackground />;
	}
	return null;
};

export default EmptyRoom;
