import React from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import FastImage from 'react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler';

import * as List from '../../List';
import { textParser } from '../utils';
import styles from './styles';
import { IItemData } from '.';
import { useTheme } from '../../../theme';
import { CustomIcon } from '../../CustomIcon';

interface IItem {
	item: IItemData;
	selected?: string;
	onSelect: Function;
}

interface IItems {
	items: IItemData[];
	selected: string[];
	onSelect: Function;
}

const keyExtractor = (item: IItemData) => item.value?.name || item.text?.text;

// RectButton doesn't work on modal (Android)
const Item = ({ item, selected, onSelect }: IItem) => {
	const itemName = item.value?.name || item.text.text.toLowerCase();
	const { colors } = useTheme();
	return (
		<Touchable testID={`multi-select-item-${itemName}`} key={itemName} onPress={() => onSelect(item)}>
			<View style={styles.item}>
				<View style={styles.flexZ}>
					{item.imageUrl ? <FastImage style={styles.itemImage} source={{ uri: item.imageUrl }} /> : null}
				</View>
				<View style={styles.flex}>
					<Text numberOfLines={1} style={{ color: colors.titleText }}>
						{textParser([item.text])}
					</Text>
				</View>
				<View style={styles.flexZ}>{selected ? <CustomIcon color={colors.tintColor} size={22} name='check' /> : null}</View>
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
		renderItem={({ item }) => <Item item={item} onSelect={onSelect} selected={selected.find(s => s === item.value)} />}
	/>
);

export default Items;
