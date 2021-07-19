import React from 'react';
import { Text, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';
import FastImage from '@rocket.chat/react-native-fast-image';

import Check from '../../Check';
import * as List from '../../List';
import { textParser } from '../utils';
import { themes } from '../../../constants/colors';

import styles from './styles';

const keyExtractor = item => item.value.toString();

// RectButton doesn't work on modal (Android)
const Item = ({
	item, selected, onSelect, theme
}) => {
	const itemName = item.value.name || item.text.text.toLowerCase();
	return (
		<Touchable
			testID={`multi-select-item-${ itemName }`}
			key={item}
			onPress={() => onSelect(item)}
			style={[
				styles.item,
				{ backgroundColor: themes[theme].backgroundColor }
			]}
		>
			<>
				{item.imageUrl ? <FastImage style={styles.itemImage} source={{ uri: item.imageUrl }} /> : null}
				<Text style={{ color: themes[theme].titleText }}>{textParser([item.text])}</Text>
				{selected ? <Check theme={theme} /> : null}
			</>
		</Touchable>
	);
};
Item.propTypes = {
	item: PropTypes.object,
	selected: PropTypes.number,
	onSelect: PropTypes.func,
	theme: PropTypes.string
};

const Items = ({
	items, selected, onSelect, theme
}) => (
	<FlatList
		data={items}
		style={[styles.items, { backgroundColor: themes[theme].backgroundColor }]}
		contentContainerStyle={[styles.itemContent, { backgroundColor: themes[theme].backgroundColor }]}
		keyboardShouldPersistTaps='always'
		ItemSeparatorComponent={List.Separator}
		keyExtractor={keyExtractor}
		renderItem={({ item }) => <Item item={item} onSelect={onSelect} theme={theme} selected={selected.find(s => s === item.value)} />}
	/>
);
Items.propTypes = {
	items: PropTypes.array,
	selected: PropTypes.array,
	onSelect: PropTypes.func,
	theme: PropTypes.string
};

export default Items;
