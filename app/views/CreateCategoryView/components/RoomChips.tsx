import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { type ICategoryRoom } from '../types';
import RoomChip from './RoomChip';

const styles = StyleSheet.create({
	chips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8
	}
});

interface IRoomChips {
	rooms: ICategoryRoom[];
	onRemove: (room: ICategoryRoom) => void;
	style?: StyleProp<ViewStyle>;
}

const RoomChips = ({ rooms, onRemove, style }: IRoomChips) =>
	rooms.length > 0 ? (
		<View style={[styles.chips, style]}>
			{rooms.map(room => (
				<RoomChip key={room.rid} room={room} onRemove={onRemove} />
			))}
		</View>
	) : null;

export default RoomChips;
