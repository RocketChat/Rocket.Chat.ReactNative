/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
	View, StyleSheet, TouchableWithoutFeedback, Modal, SafeAreaView, Text, FlatList
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import RCButton from '../Button';
import Separator from '../Separator';
import TextInput from '../../presentation/TextInput';
import Check from '../Check';

import { extractText } from './utils';
import { themes } from '../../constants/colors';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		zIndex: 0,
		flex: 1
	},
	item: {
		height: 48,
		alignItems: 'center',
		flexDirection: 'row'
	},
	content: {
		overflow: 'hidden',
		marginHorizontal: 18,
		marginVertical: 26,
		borderRadius: 6,
		alignSelf: 'stretch',
		flex: 1
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		paddingVertical: 8
	},
	items: {
		flex: 1
	},
	inputContent: {
		flexDirection: 'row',
		padding: 5
	}
});

const Item = ({
	item, selected, onSelect, theme
}) => (
	<RectButton
		key={item}
		onPress={() => onSelect(item)}
		style={[
			styles.item,
			{ backgroundColor: themes[theme].auxiliaryBackground }
		]}
	>
		<Text style={{ color: themes[theme].titleText }}>{extractText(item.text)}</Text>
		{selected ? <Check theme={theme} /> : null}
	</RectButton>
);

const Items = ({
	items, selected, onSelect, theme
}) => (
	<FlatList
		data={items}
		style={{ backgroundColor: themes[theme].auxiliaryBackground }}
		contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
		ItemSeparatorComponent={() => <Separator theme={theme} />}
		renderItem={({ item }) => <Item item={item} onSelect={onSelect} theme={theme} selected={selected.find(s => s === item.value)} />}
	/>
);

export const MultiSelect = ({
	options = [],
	onChange,
	placeholder = { text: 'Search' },
	theme = 'light'
}) => {
	const [selected, select] = useState([]);
	const [opened, open] = useState(false);
	const [search, onSearchChange] = useState('');

	const onSelect = (item) => {
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

	const items = options.filter(option => extractText(option.text).toLowerCase().includes(search.toLowerCase()));

	return (
		<View>
			<Modal
				transparent
				visible={opened}
				animationType='fade'
				onRequestClose={() => open(false)}
			>
				<SafeAreaView style={styles.container}>
					<TouchableWithoutFeedback onPress={() => open(false)}>
						<View style={[styles.backdrop, { backgroundColor: `${ themes[theme].backdropColor }50` }]} />
					</TouchableWithoutFeedback>
					<View style={styles.content}>
						<View style={[styles.inputContent, { backgroundColor: themes[theme].auxiliaryBackground }]}>
							<TextInput
								value={search}
								onChangeText={onSearchChange}
								placeholder={placeholder.text}
								style={[styles.searchInput, { color: themes[theme].titleText }]}
								theme={theme}
							/>
						</View>
						<View keyboardShouldPersistTaps='always' style={styles.items}>
							<Items items={items} selected={selected} onSelect={onSelect} theme={theme} />
						</View>
					</View>
				</SafeAreaView>
			</Modal>
			<RCButton
				title={`${ selected.length } selecteds`}
				onPress={() => open(true)}
				onRequestClose={() => open(false)}
				theme={theme}
			/>
		</View>
	);
};
