import React, { useEffect, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import Button from '../../Button';
import TextInput from '../../TextInput';
import { textParser } from '../utils';
import { themes } from '../../../constants/colors';
import I18n from '../../../i18n';
import { isIOS } from '../../../utils/deviceInfo';
import Chips from './Chips';
import Items from './Items';
import Input from './Input';
import styles from './styles';

interface IMultiSelect {
	options: [];
	onChange: Function;
	placeholder: {
		text: string;
	};
	context: number;
	loading: boolean;
	multiselect: boolean;
	onSearch: Function;
	onClose: Function;
	inputStyle: object;
	value: { text: any }[];
	disabled: boolean;
	theme: string;
}

const ANIMATION_DURATION = 200;
const ANIMATION_PROPS = {
	duration: ANIMATION_DURATION,
	easing: Easing.inOut(Easing.quad),
	useNativeDriver: true
};
const animatedValue = new Animated.Value(0);

const behavior = isIOS ? 'padding' : null;

export const MultiSelect = React.memo(
	({
		options = [],
		onChange,
		placeholder = { text: 'Search' },
		context,
		loading,
		value: values,
		multiselect = false,
		onSearch,
		onClose = () => {},
		disabled,
		inputStyle,
		theme
	}: IMultiSelect) => {
		const [selected, select] = useState<any>(Array.isArray(values) ? values : []);
		const [open, setOpen] = useState(false);
		const [search, onSearchChange] = useState('');
		const [currentValue, setCurrentValue] = useState('');
		const [showContent, setShowContent] = useState(false);

		useEffect(() => {
			if (Array.isArray(values)) {
				select(values);
			}
		}, [values]);

		useEffect(() => {
			setOpen(showContent);
		}, [showContent]);

		useEffect(() => {
			if (values && values.length && !multiselect) {
				setCurrentValue(values[0].text);
			}
		}, []);

		const onShow = () => {
			Animated.timing(animatedValue, {
				toValue: 1,
				...ANIMATION_PROPS
			}).start();
			setShowContent(true);
		};

		const onHide = () => {
			onClose();
			Animated.timing(animatedValue, {
				toValue: 0,
				...ANIMATION_PROPS
			}).start(() => setShowContent(false));
		};

		const onSelect = (item: any) => {
			const {
				value,
				text: { text }
			} = item;
			if (multiselect) {
				let newSelect = [];
				if (!selected.includes(value)) {
					newSelect = [...selected, value];
				} else {
					newSelect = selected.filter((s: any) => s !== value);
				}
				select(newSelect);
				onChange({ value: newSelect });
			} else {
				onChange({ value });
				setCurrentValue(text);
				onHide();
			}
		};

		const renderContent = () => {
			const items: any = onSearch
				? options
				: options.filter((option: any) => textParser([option.text]).toLowerCase().includes(search.toLowerCase()));

			return (
				<View style={[styles.modal, { backgroundColor: themes[theme].backgroundColor }]}>
					<View style={[styles.content, { backgroundColor: themes[theme].backgroundColor }]}>
						<TextInput
							testID='multi-select-search'
							/* @ts-ignore*/
							onChangeText={onSearch || onSearchChange}
							placeholder={I18n.t('Search')}
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
			<Button title={`${selected.length} selecteds`} onPress={onShow} loading={loading} theme={theme} />
		) : (
			// @ts-ignore
			<Input onPress={onShow} theme={theme} loading={loading} disabled={disabled} inputStyle={inputStyle}>
				<Text style={[styles.pickerText, { color: currentValue ? themes[theme].titleText : themes[theme].auxiliaryText }]}>
					{currentValue || placeholder.text}
				</Text>
			</Input>
		);

		if (context === BLOCK_CONTEXT.FORM) {
			const items: any = options.filter((option: any) => selected.includes(option.value));
			button = (
				// @ts-ignore
				<Input onPress={onShow} theme={theme} loading={loading} disabled={disabled} inputStyle={inputStyle}>
					{items.length ? (
						<Chips items={items} onSelect={(item: any) => (disabled ? {} : onSelect(item))} theme={theme} />
					) : (
						<Text style={[styles.pickerText, { color: themes[theme].auxiliaryText }]}>{placeholder.text}</Text>
					)}
				</Input>
			);
		}

		return (
			<>
				<Modal animationType='fade' transparent visible={open} onRequestClose={onHide} onShow={onShow}>
					<TouchableWithoutFeedback onPress={onHide}>
						<View style={styles.container}>
							<View
								style={[
									StyleSheet.absoluteFill,
									{
										opacity: themes[theme].backdropOpacity,
										backgroundColor: themes[theme].backdropColor
									}
								]}
							/>
							{/* @ts-ignore*/}
							<KeyboardAvoidingView style={styles.keyboardView} behavior={behavior}>
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
	}
);
