import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import FastImage from 'react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler';

import Check from '../../Check';
import * as List from '../../List';
import { textParser } from '../utils';
import { themes } from '../../../lib/constants';
import styles from './styles';
import { IItemData } from '.';
import { TSupportedThemes } from '../../../theme';

interface IItem {
	item: IItemData;
	selected?: string;
	onSelect: Function;
	theme: TSupportedThemes;
}

interface IItems {
	items: IItemData[];
	selected: string[];
	onSelect: Function;
	theme: TSupportedThemes;
}

const keyExtractor = (item: IItemData) => item.value?.name || item.text?.text;

// RectButton doesn't work on modal (Android)
const Item = ({ item, selected, onSelect, theme }: IItem) => {
	const itemName = item.value?.name || item.text.text.toLowerCase();
	return (
		<Touchable testID={`multi-select-item-${itemName}`} key={itemName} onPress={() => onSelect(item)} style={[styles.item]}>
			<>
				{item.imageUrl ? <FastImage style={styles.itemImage} source={{ uri: item.imageUrl }} /> : null}
				<Text style={{ color: themes[theme].titleText }}>{textParser([item.text])}</Text>
				{selected ? <Check /> : null}
			</>
		</Touchable>
	);
};

const Items = ({ items, selected, onSelect, theme }: IItems) => (
	<FlatList
		data={items}
		style={[styles.items]}
		contentContainerStyle={[styles.itemContent]}
		keyboardShouldPersistTaps='always'
		ItemSeparatorComponent={List.Separator}
		keyExtractor={keyExtractor}
		renderItem={({ item }) => (
			<Item item={item} onSelect={onSelect} theme={theme} selected={selected.find(s => s === item.value)} />
		)}
	/>
);

export default Items;
