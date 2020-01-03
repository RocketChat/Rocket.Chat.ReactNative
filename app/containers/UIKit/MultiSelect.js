import React, { useState } from 'react';
import {
	View, StyleSheet, TouchableOpacity, Text, FlatList, Image
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import Button from '../Button';
import Separator from '../Separator';
import TextInput from '../TextInput';
import Check from '../Check';
import ActivityIndicator from '../ActivityIndicator';

import { textParser } from './utils';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';

import sharedStyles from '../../views/Styles';
import Touch from '../../utils/touch';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		margin: 0,
		justifyContent: 'flex-end'
	},
	content: {
		height: 400,
		width: '100%',
		borderTopRightRadius: 16,
		borderTopLeftRadius: 16,
		padding: 16,
		overflow: 'hidden'
	},
	modal: {
		padding: 0,
		margin: 0,
		flex: 1
	},
	item: {
		height: 48,
		alignItems: 'center',
		flexDirection: 'row'
	},
	input: {
		height: 48,
		paddingHorizontal: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 2,
		alignItems: 'center',
		flexDirection: 'row'
	},
	icon: {
		position: 'absolute',
		right: 16
	},
	chips: {
		alignItems: 'center'
	},
	chip: {
		flexDirection: 'row',
		borderRadius: 2,
		height: 28,
		alignItems: 'center',
		paddingRight: 4,
		marginRight: 8,
		maxWidth: 100
	},
	chipText: {
		maxWidth: 64,
		paddingHorizontal: 8,
		...sharedStyles.textMedium,
		fontSize: 14
	},
	chipImage: {
		marginLeft: 4,
		borderRadius: 2,
		width: 20,
		height: 20
	}
});

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
		ItemSeparatorComponent={() => <Separator theme={theme} />}
		keyExtractor={item => `${ item.value }`}
		renderItem={({ item }) => <Item item={item} onSelect={onSelect} theme={theme} selected={selected.find(s => s === item.value)} />}
	/>
);
Items.propTypes = {
	items: PropTypes.array,
	selected: PropTypes.array,
	onSelect: PropTypes.func,
	theme: PropTypes.string
};

export const Chip = ({ item, onSelect, theme }) => (
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

export const Chips = ({ items, onSelect, theme }) => (
	<View>
		<FlatList
			data={items}
			keyExtractor={item => `${ item.value }`}
			contentContainerStyle={styles.chips}
			renderItem={({ item }) => <Chip item={item} onSelect={onSelect} theme={theme} />}
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

export const MultiSelect = ({
	options = [],
	onChange,
	placeholder = { text: 'Search' },
	context,
	loading,
	theme
}) => {
	const [selected, select] = useState([]);
	const [opened, open] = useState(false);
	const [search, onSearchChange] = useState('');

	const onSelect = (item) => {
		open(false);
		const { value } = item;
		let newSelect = [];
		if (!selected.includes(value)) {
			newSelect = [...selected, value];
		} else {
			newSelect = selected.filter(s => s !== value);
		}
		select(newSelect);
		onChange({ value: newSelect });
	};

	const items = options.filter(option => textParser([option.text]).pop().toLowerCase().includes(search.toLowerCase()));

	let button = (
		<Button
			title={`${ selected.length } selecteds`}
			onPress={() => open(true)}
			onRequestClose={() => open(false)}
			loading={loading}
			theme={theme}
		/>
	);

	if (context === BLOCK_CONTEXT.FORM) {
		button = (
			<Touch
				onPress={() => open(!opened)}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				theme={theme}
			>
				<View style={[styles.input, { borderColor: themes[theme].separatorColor }]}>
					<Chips items={options.filter(option => selected.includes(option.value))} onSelect={onSelect} theme={theme} />
					{
						loading
							? <ActivityIndicator style={[styles.loading, styles.icon]} />
							: <CustomIcon name='arrow-down' size={22} color={themes[theme].auxiliaryText} style={styles.icon} />
					}
				</View>
			</Touch>
		);
	}

	return (
		<>
			<Modal
				isVisible={opened}
				// swipeDirection='down'
				style={styles.modal}
				// onSwipeThreshold={1}
				// onSwipe={() => open(false)}
			>
				<View style={styles.container}>
					<View style={[styles.content, { backgroundColor: themes[theme].backgroundColor }]}>
						<TextInput
							onChangeText={onSearchChange}
							placeholder={placeholder.text}
							theme={theme}
						/>
						<Items items={items} selected={selected} onSelect={onSelect} theme={theme} />
					</View>
				</View>
			</Modal>
			{button}
		</>
	);
};
MultiSelect.propTypes = {
	options: PropTypes.array,
	onChange: PropTypes.func,
	placeholder: PropTypes.object,
	context: PropTypes.number,
	loading: PropTypes.bool,
	theme: PropTypes.string
};
