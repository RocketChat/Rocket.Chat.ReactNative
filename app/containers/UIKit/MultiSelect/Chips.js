import React from 'react';
import {
	View, Text, FlatList, Image
} from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../../utils/touch';
import { themes } from '../../../constants/colors';
import { textParser } from '../utils';
import { CustomIcon } from '../../../lib/Icons';

import styles from './styles';

const keyExtractor = item => item.value.toString();

const Chip = ({ item, onSelect, theme }) => (
	<Touch
		key={item.value}
		onPress={() => onSelect(item)}
		style={[styles.chip, { backgroundColor: themes[theme].auxiliaryBackground }]}
		theme={theme}
	>
		{item.imageUrl ? <Image style={styles.chipImage} source={{ uri: item.imageUrl }} /> : null}
		<Text style={[styles.chipText, { color: themes[theme].titleText }]}>{textParser([item.text]).pop()}</Text>
		<CustomIcon name='cross' size={16} color={themes[theme].auxiliaryColor} />
	</Touch>
);
Chip.propTypes = {
	item: PropTypes.object,
	onSelect: PropTypes.func,
	theme: PropTypes.string
};

const Chips = ({ items, onSelect, theme }) => (
	<View>
		<FlatList
			data={items}
			keyExtractor={keyExtractor}
			contentContainerStyle={styles.chips}
			renderItem={({ item }) => <Chip item={item} onSelect={onSelect} theme={theme} />}
			keyboardShouldPersistTaps='always'
			showsHorizontalScrollIndicator={false}
			horizontal
		/>
	</View>
);
Chips.propTypes = {
	items: PropTypes.array,
	onSelect: PropTypes.func,
	theme: PropTypes.string
};

export default Chips;
