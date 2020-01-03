import React from 'react';
import { TouchableOpacity, Text, FlatList } from 'react-native';
import PropTypes from 'prop-types';

import Separator from '../../Separator';
import Check from '../../Check';

import { textParser } from '../utils';
import { themes } from '../../../constants/colors';

import styles from './styles';

const keyExtractor = item => item.value.toString();

// RectButton doesn't work on modal (Android)
const Item = ({
	item, selected, onSelect, theme
}) => (
	<TouchableOpacity
		key={item}
		onPress={() => onSelect(item)}
		style={[
			styles.item,
			{ backgroundColor: themes[theme].backgroundColor }
		]}
	>
		<Text style={{ color: themes[theme].titleText }}>{textParser([item.text]).pop()}</Text>
		{selected ? <Check theme={theme} /> : null}
	</TouchableOpacity>
);
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
		style={{ backgroundColor: themes[theme].backgroundColor }}
		contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
		keyboardShouldPersistTaps='always'
		ItemSeparatorComponent={() => <Separator theme={theme} />}
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
