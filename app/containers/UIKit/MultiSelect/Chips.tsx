import React from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import FastImage from '@rocket.chat/react-native-fast-image';

import { themes } from '../../../constants/colors';
import { textParser } from '../utils';
import { CustomIcon } from '../../../lib/Icons';
import styles from './styles';

interface IChip {
	item: {
		value: string;
		imageUrl: string;
		text: string;
	};
	onSelect: Function;
	style?: object;
	theme: string;
}

interface IChips {
	items: [];
	onSelect: Function;
	style?: object;
	theme: string;
}

const keyExtractor = (item: any) => item.value.toString();

const Chip = ({ item, onSelect, style, theme }: IChip) => (
	<Touchable
		key={item.value}
		onPress={() => onSelect(item)}
		style={[styles.chip, { backgroundColor: themes[theme].auxiliaryBackground }, style]}
		background={Touchable.Ripple(themes[theme].bannerBackground)}>
		<>
			{item.imageUrl ? <FastImage style={styles.chipImage} source={{ uri: item.imageUrl }} /> : null}
			<Text numberOfLines={1} style={[styles.chipText, { color: themes[theme].titleText }]}>
				{textParser([item.text])}
			</Text>
			<CustomIcon name='close' size={16} color={themes[theme].auxiliaryText} />
		</>
	</Touchable>
);
Chip.propTypes = {};

const Chips = ({ items, onSelect, style, theme }: IChips) => (
	<View style={styles.chips}>
		{items.map(item => (
			<Chip key={keyExtractor(item)} item={item} onSelect={onSelect} style={style} theme={theme} />
		))}
	</View>
);

export default Chips;
