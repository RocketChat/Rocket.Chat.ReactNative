import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '~/containers/Avatar';
import { CustomIcon } from '~/containers/CustomIcon';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { type ICategoryRoom } from '../types';

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		gap: 12
	},
	title: {
		flex: 1,
		fontSize: 18,
		lineHeight: 26,
		...sharedStyles.textMedium
	}
});

interface IRoomCheckItem {
	room: ICategoryRoom;
	isSelected: boolean;
	onToggle: (room: ICategoryRoom) => void;
}

const RoomCheckItem = ({ room, isSelected, onToggle }: IRoomCheckItem) => {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={() => onToggle(room)}
			testID={`create-category-room-${room.title}`}
			accessibilityRole='checkbox'
			accessibilityLabel={`${room.title} ${isSelected ? I18n.t('Selected') : I18n.t('Unselected')}`}
			accessibilityState={{ checked: isSelected }}
			android_ripple={{ color: colors.surfaceNeutral }}
			style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceNeutral : colors.surfaceLight })}>
			<View style={styles.row}>
				<Avatar text={room.avatar} type={room.t} rid={room.rid} size={28} />
				<Text style={[styles.title, { color: colors.fontDefault }]} numberOfLines={1}>
					{room.title}
				</Text>
				<CustomIcon
					name={isSelected ? 'checkbox-checked' : 'checkbox-unchecked'}
					size={24}
					color={isSelected ? colors.buttonBackgroundPrimaryDefault : colors.strokeMedium}
				/>
			</View>
		</Pressable>
	);
};

export default memo(RoomCheckItem);
