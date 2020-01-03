import React, { useState } from 'react';
import {
	View, Text, TouchableWithoutFeedback, Modal, KeyboardAvoidingView
} from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import Button from '../../Button';
import TextInput from '../../TextInput';

import { textParser } from '../utils';
import { themes } from '../../../constants/colors';

import Chips from './Chips';
import Items from './Items';
import Input from './Input';

import styles from './styles';

export const MultiSelect = ({
	options = [],
	onChange,
	placeholder = { text: 'Search' },
	context,
	loading,
	multiselect = false,
	theme
}) => {
	const [selected, select] = useState([]);
	const [opened, open] = useState(false);
	const [search, onSearchChange] = useState('');
	const [current, onChangeCurrent] = useState('');

	const onSelect = (item) => {
		const { value } = item;
		if (multiselect) {
			let newSelect = [];
			if (!selected.includes(value)) {
				newSelect = [...selected, value];
			} else {
				newSelect = selected.filter(s => s !== value);
			}
			select(newSelect);
			onChange({ value: newSelect });
		} else {
			onChange({ value });
			onChangeCurrent(value);
			open(false);
		}
	};

	const items = options.filter(option => textParser([option.text]).pop().toLowerCase().includes(search.toLowerCase()));

	let button = multiselect ? (
		<Button
			title={`${ selected.length } selecteds`}
			onPress={() => open(true)}
			onRequestClose={() => open(false)}
			loading={loading}
			theme={theme}
		/>
	) : (
		<Input
			open={open}
			theme={theme}
			loading={loading}
		>
			<Text style={[styles.pickerText, { color: themes[theme].auxiliaryText }]}>{current}</Text>
		</Input>
	);

	if (context === BLOCK_CONTEXT.FORM) {
		button = (
			<Input
				open={open}
				theme={theme}
				loading={loading}
			>
				<Chips items={options.filter(option => selected.includes(option.value))} onSelect={onSelect} theme={theme} />
			</Input>
		);
	}

	return (
		<>
			<Modal
				animationType='slide'
				transparent
				visible={opened}
				onRequestClose={() => open(false)}
			>
				<TouchableWithoutFeedback onPress={() => open(false)}>
					<View style={[styles.container, { backgroundColor: `${ themes[theme].backdropColor }30` }]}>
						<KeyboardAvoidingView style={styles.keyboardView} behavior='padding'>
							<View style={[styles.modal, { backgroundColor: themes[theme].backgroundColor }]}>
								<View style={[styles.content, { backgroundColor: themes[theme].backgroundColor }]}>
									<TextInput
										onChangeText={onSearchChange}
										placeholder={placeholder.text}
										theme={theme}
									/>
									<Items items={items} selected={selected} onSelect={onSelect} theme={theme} />
								</View>
							</View>
						</KeyboardAvoidingView>
					</View>
				</TouchableWithoutFeedback>
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
	multiselect: PropTypes.bool,
	theme: PropTypes.string
};
