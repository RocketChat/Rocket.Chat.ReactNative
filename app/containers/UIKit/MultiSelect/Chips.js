import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';
import FastImage from '@rocket.chat/react-native-fast-image';

import { themes } from '../../../constants/colors';
import { textParser } from '../utils';
import { CustomIcon } from '../../../lib/Icons';

import styles from './styles';

const keyExtractor = item => item.value.toString();

const Chip = ({
	item, onSelect, style, theme
}) => (
	<Touchable
		key={item.value}
		onPress={() => onSelect(item)}
		style={[styles.chip, { backgroundColor: themes[theme].auxiliaryBackground }, style]}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
	>
		<>
			{item.imageUrl ? <FastImage style={styles.chipImage} source={{ uri: item.imageUrl }} /> : null}
			<Text numberOfLines={1} style={[styles.chipText, { color: themes[theme].titleText }]}>{textParser([item.text])}</Text>
			<CustomIcon name='close' size={16} color={themes[theme].auxiliaryText} />
		</>
	</Touchable>
);
Chip.propTypes = {
	item: PropTypes.object,
	onSelect: PropTypes.func,
	style: PropTypes.object,
	theme: PropTypes.string
};

const Chips = ({
	items, onSelect, style, theme
}) => (
	<View style={styles.chips}>
		{items.map(item => <Chip key={keyExtractor(item)} item={item} onSelect={onSelect} style={style} theme={theme} />)}
	</View>
);
Chips.propTypes = {
	items: PropTypes.array,
	onSelect: PropTypes.func,
	style: PropTypes.object,
	theme: PropTypes.string
};

export default Chips;
