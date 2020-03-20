import React, { useState, useEffect } from 'react';
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

const ANIMATION_DURATION = 200;
const ANIMATION_PROPS = {
	duration: ANIMATION_DURATION,
	easing: Easing.inOut(Easing.quad),
	useNativeDriver: true
};
const animatedValue = new Animated.Value(0);

export const MultiSelect = React.memo(({
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
	const [open, setOpen] = useState(false);
	const [search, onSearchChange] = useState('');
	const [currentValue, setCurrentValue] = useState('');
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		if (values) {
			select(values);
		}
	}, [values]);

	useEffect(() => {
		setOpen(showContent);
	}, [showContent]);

	const onShow = () => {
		Animated.timing(
			animatedValue,
			{
				toValue: 1,
				...ANIMATION_PROPS
			}
		).start();
		setShowContent(true);
	};

	const onHide = () => {
		Animated.timing(
			animatedValue,
			{
				toValue: 0,
				...ANIMATION_PROPS
			}
		).start(() => setShowContent(false));
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
			setCurrentValue(value);
			setOpen(false);
		}
	};

	const renderContent = () => {
		const items = options.filter(option => textParser([option.text]).toLowerCase().includes(search.toLowerCase()));

		return (
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
		);
	};

	const translateY = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [600, 0]
	});

	let button = multiselect ? (
		<Button
			title={`${ selected.length } selecteds`}
			onPress={onShow}
			loading={loading}
			theme={theme}
		/>
	) : (
		<Input
			open={onShow}
			theme={theme}
			loading={loading}
		>
			<Text style={[styles.pickerText, { color: themes[theme].auxiliaryText }]}>{currentValue}</Text>
		</Input>
	);

	if (context === BLOCK_CONTEXT.FORM) {
		button = (
			<Input
				open={onShow}
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
				animationType='fade'
				transparent
				visible={open}
				onRequestClose={onHide}
				onShow={onShow}
			>
				<TouchableWithoutFeedback onPress={onHide}>
					<View style={styles.container}>
						<View style={[styles.backdrop, { backgroundColor: themes[theme].backdropColor }]} />
						<KeyboardAvoidingView style={styles.keyboardView} behavior='padding'>
							<Animated.View style={[styles.animatedContent, { transform: [{ translateY }] }]}>
								{showContent ? renderContent() : null}
							</Animated.View>
						</KeyboardAvoidingView>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
			{button}
		</>
	);
});
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
