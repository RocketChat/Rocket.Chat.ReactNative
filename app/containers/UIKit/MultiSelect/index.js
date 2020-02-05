import React, { useState } from 'react';
import {
	View, Text, TouchableWithoutFeedback, Modal, KeyboardAvoidingView, Animated, Easing
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

const ANIMATION_DURATION = 0;
const ANIMATION_PROPS = {
	duration: ANIMATION_DURATION,
	easing: Easing.inOut(Easing.quad),
	useNativeDriver: true
};

export const MultiSelect = ({
	options = [],
	onChange,
	placeholder = { text: 'Search' },
	context,
	loading,
	value: values,
	multiselect = false,
	theme
}) => {
	const [selected, select] = useState(values || []);
	const [opened, open] = useState(false);
	const [search, onSearchChange] = useState('');
	const [current, onChangeCurrent] = useState('');

	const animatedValue = new Animated.Value(0);

	const onShow = () => {
		Animated.timing(
			animatedValue,
			{
				toValue: opened ? 1 : 0,
				...ANIMATION_PROPS
			}
		).start();
	};

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

	const items = options.filter(option => textParser([option.text]).toLowerCase().includes(search.toLowerCase()));

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

	const backdropOpacity = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 0.3]
	});

	return (
		<>
			<Modal
				animationType='slide'
				transparent
				visible={opened}
				onRequestClose={() => open(false)}
				onShow={onShow}
			>
				<TouchableWithoutFeedback onPress={() => open(false)}>
					<View style={styles.container}>
						<Animated.View style={[styles.backdrop, { backgroundColor: themes[theme].backdropColor, opacity: backdropOpacity }]} />
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
	value: PropTypes.array,
	theme: PropTypes.string
};
