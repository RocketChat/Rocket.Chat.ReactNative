import { StyleSheet } from 'react-native';

import Chip from '~/containers/Chip';
import { type ICategoryRoom } from '../types';

const styles = StyleSheet.create({
	chip: {
		marginHorizontal: 0
	}
});

const RoomChip = ({ room, onRemove }: { room: ICategoryRoom; onRemove: (room: ICategoryRoom) => void }) => (
	<Chip
		text={room.title}
		avatar={room.avatar}
		avatarType={room.t}
		rid={room.rid}
		onPress={() => onRemove(room)}
		testID={`create-category-selected-room-${room.title}`}
		style={styles.chip}
		fullWidth
	/>
);

export default RoomChip;
