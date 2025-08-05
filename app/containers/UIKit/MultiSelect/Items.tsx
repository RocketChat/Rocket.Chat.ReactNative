import React from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import { Image } from 'expo-image';
import { FlatList } from 'react-native-gesture-handler';

import * as List from '../../List';
import { textParser } from '../utils';
import styles from './styles';
import { IItemData } from '.';
import { useTheme } from '../../../theme';
import { CustomIcon } from '../../CustomIcon';
import I18n from '../../../i18n';

interface IItem {
	item: IItemData;
	selected: boolean;
	onSelect: Function;
}

interface IItems {
	items: IItemData[];
	selected: IItemData[];
	onSelect: Function;
}

const keyExtractor = (item: IItemData) => item.value?.name || item.text?.text;

// RectButton doesn't work on modal (Android)
const Item = ({ item, selected, onSelect }: IItem) => {
	const itemName = item.value?.name || item.text.text.toLowerCase();
	const { colors } = useTheme();
	const iconName = selected ? 'checkbox-checked' : 'checkbox-unchecked';
	const iconColor = selected ? colors.badgeBackgroundLevel2 : colors.strokeMedium;

	return (
		<Touchable
			accessible
			accessibilityLabel={`${textParser([item.text])}. ${selected ? I18n.t('Selected') : ''}`}
			accessibilityRole='checkbox'
			testID={`multi-select-item-${itemName}`}
			key={itemName}
			onPress={() => onSelect(item)}>
			<View style={styles.item}>
				<View style={styles.flexZ}>
					{item.imageUrl ? <Image style={styles.itemImage} source={{ uri: item.imageUrl }} /> : null}
				</View>
				<View style={styles.flex}>
					<Text numberOfLines={1} style={{ color: colors.fontTitlesLabels }}>
						{textParser([item.text])}
					</Text>
				</View>
				<View style={styles.flexZ}>
					<CustomIcon color={iconColor} size={22} name={iconName} />
				</View>
			</View>
		</Touchable>
	);
};

const Items = ({ items, selected, onSelect }: IItems) => (
	<FlatList
		data={items}
		style={styles.items}
		contentContainerStyle={styles.itemContent}
		keyboardShouldPersistTaps='always'
		ItemSeparatorComponent={List.Separator}
		keyExtractor={keyExtractor}
		renderItem={({ item }) => <Item item={item} onSelect={onSelect} selected={!!selected.find(s => s.value === item.value)} />}
	/>
);

export default Items;
