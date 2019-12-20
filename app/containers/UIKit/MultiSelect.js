/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
	View, Text, FlatList, TouchableOpacity, StyleSheet
} from 'react-native';
import Modal from 'react-native-modal';

import RCButton from '../Button';
import Separator from '../Separator';

import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';

const styles = StyleSheet.create({
	item: {
		height: 48,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%'
	},
	modal: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	content: {
		height: 300,
		width: 300,
		backgroundColor: 'white',
		borderRadius: 4,
		overflow: 'hidden'
	},
	selectedItems: {
		height: 36,
		flexGrow: 0
	},
	selected: {
		height: 24,
		minWidth: 50,
		marginVertical: 4,
		marginHorizontal: 2,
		borderRadius: 4,
		paddingLeft: 8,
		backgroundColor: 'grey',
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row'
	},
	cross: {
		marginLeft: 4,
		paddingRight: 8
	}
});

const Item = ({ item, onSelect, theme }) => (
	<TouchableOpacity
		key={item}
		onPress={() => onSelect(item)}
		style={[
			styles.item,
			{ backgroundColor: themes[theme].auxiliaryBackground }
		]}
	>
		<Text style={{ color: themes[theme].titleText }}>{item}</Text>
	</TouchableOpacity>
);

const ItemSelected = ({ item, onSelect, theme }) => (
	<TouchableOpacity
		key={item}
		onPress={() => onSelect(item)}
		style={[
			styles.selected,
			{ backgroundColor: themes[theme].auxiliaryBackground }
		]}
	>
		<Text style={{ color: themes[theme].titleText }}>{item}</Text>
		<CustomIcon name='cross' size={14} style={styles.cross} />
	</TouchableOpacity>
);

const Selected = ({
	selected, onSelect, theme
}) => (
	<FlatList
		data={selected}
		style={styles.selectedItems}
		renderItem={({ item }) => <ItemSelected item={item} onSelect={onSelect} theme={theme} />}
		horizontal
	/>
);

const SelectModal = ({
	values, onSelect, theme
}) => (
	<FlatList
		data={values}
		style={{ backgroundColor: themes[theme].auxiliaryBackground }}
		ItemSeparatorComponent={() => <Separator theme={theme} />}
		renderItem={({ item }) => <Item item={item} onSelect={onSelect} theme={theme} />}
	/>
);

export const MultiSelect = withTheme(({ theme = 'light' }) => {
	const [selected, select] = useState([]);
	const [opened, open] = useState(false);
	const values = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

	const onSelect = (value) => {
		if (!selected.includes(value)) {
			select([...selected, value]);
		} else {
			select(selected.filter(item => item !== value));
		}
	};

	return (
		<View>
			<RCButton
				title={`${ selected.length } selecteds`}
				onPress={() => open(true)}
				theme='light'
			/>
			<Modal isVisible={opened}>
				<View style={styles.modal}>
					<View style={styles.content}>
						<Selected selected={selected} onSelect={onSelect} theme={theme} />
						<SelectModal values={values} onSelect={onSelect} theme={theme} />
					</View>
				</View>
			</Modal>
		</View>
	);
});
