import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { textParser } from '../utils';
import { CustomIcon } from '~/containers/CustomIcon';
import styles from './styles';
import { type IItemData } from '.';
import { useTheme } from '~/theme';

interface IChip {
	item: IItemData;
	onSelect: (item: IItemData) => void;
	style?: object;
}

interface IChips {
	items: IItemData[];
	onSelect: (item: IItemData) => void;
	style?: object;
}

const keyExtractor = (item: IItemData) => item.value.toString();

const Chip = ({ item, onSelect, style }: IChip) => {
	const { colors } = useTheme();
	return (
		<Pressable
			key={item.value}
			onPress={() => onSelect(item)}
			accessibilityRole='button'
			style={({ pressed }) => [styles.chip, { backgroundColor: colors.surfaceHover }, style, pressed && styles.pressed]}
			testID={`multi-select-chip-${item.value}`}>
			<>
				{item.imageUrl ? <Image style={styles.chipImage} source={{ uri: item.imageUrl }} /> : null}
				<Text numberOfLines={1} style={[styles.chipText, { color: colors.fontTitlesLabels }]}>
					{textParser([item.text])}
				</Text>
				<CustomIcon name='close' size={16} color={colors.fontSecondaryInfo} />
			</>
		</Pressable>
	);
};
Chip.propTypes = {};

const Chips = ({ items, onSelect, style }: IChips) => (
	<View style={styles.chips}>
		{items.map(item => (
			<Chip key={keyExtractor(item)} item={item} onSelect={onSelect} style={style} />
		))}
	</View>
);

export default Chips;
