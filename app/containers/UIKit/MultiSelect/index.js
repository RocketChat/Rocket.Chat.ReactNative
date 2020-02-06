import React from 'react';
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

export class MultiSelect extends React.Component {
	static propTypes = {
		options: PropTypes.array,
		onChange: PropTypes.func,
		placeholder: PropTypes.object,
		context: PropTypes.number,
		loading: PropTypes.bool,
		multiselect: PropTypes.bool,
		value: PropTypes.array,
		theme: PropTypes.string
	}

	static defaultProps = {
		options: [],
		placeholder: { text: 'Search' }
	}

	constructor(props) {
		super(props);
		const { value } = props;
		this.state = {
			showContent: true,
			selected: value || [],
			open: false,
			search: '',
			current: ''
		};
		this.animatedValue = new Animated.Value(0);
	}

	onShow = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				...ANIMATION_PROPS
			}
		).start();
		this.setState({ showContent: true, open: true });
	}

	onHide = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				...ANIMATION_PROPS
			}
		).start(() => {
			this.setState(
				{ showContent: false },
				() => this.setState({ open: false })
			);
		});
	}

	onSelect = (item) => {
		const { selected } = this.state;
		const { onChange, multiselect } = this.props;
		const { value } = item;
		if (multiselect) {
			let newSelect = [];
			if (!selected.includes(value)) {
				newSelect = [...selected, value];
			} else {
				newSelect = selected.filter(s => s !== value);
			}
			this.setState({ selected: newSelect });
			onChange({ value: newSelect });
		} else {
			onChange({ value });
			this.setState({ current: value, open: false });
		}
	};

	renderContent = () => {
		const { selected, search } = this.state;
		const { theme, options, placeholder } = this.props;

		const items = options.filter(option => textParser([option.text]).toLowerCase().includes(search.toLowerCase()));

		return (
			<KeyboardAvoidingView style={styles.keyboardView} behavior='padding'>
				<View style={[styles.modal, { backgroundColor: themes[theme].backgroundColor }]}>
					<View style={[styles.content, { backgroundColor: themes[theme].backgroundColor }]}>
						<TextInput
							onChangeText={text => this.setState({ search: text })}
							placeholder={placeholder.text}
							theme={theme}
						/>
						<Items items={items} selected={selected} onSelect={this.onSelect} theme={theme} />
					</View>
				</View>
			</KeyboardAvoidingView>
		);
	}

	render() {
		const {
			open,
			current,
			selected,
			showContent
		} = this.state;
		const {
			theme,
			loading,
			options,
			context,
			multiselect
		} = this.props;

		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [600, 0]
		});

		let button = multiselect ? (
			<Button
				title={`${ selected.length } selecteds`}
				onPress={this.onShow}
				loading={loading}
				theme={theme}
			/>
		) : (
			<Input
				open={this.onShow}
				theme={theme}
				loading={loading}
			>
				<Text style={[styles.pickerText, { color: themes[theme].auxiliaryText }]}>{current}</Text>
			</Input>
		);

		if (context === BLOCK_CONTEXT.FORM) {
			button = (
				<Input
					open={this.onShow}
					theme={theme}
					loading={loading}
				>
					<Chips items={options.filter(option => selected.includes(option.value))} onSelect={this.onSelect} theme={theme} />
				</Input>
			);
		}

		return (
			<>
				<Modal
					animationType='fade'
					transparent
					visible={open}
					onRequestClose={this.onHide}
					onShow={this.onShow}
				>
					<TouchableWithoutFeedback onPress={this.onHide}>
						<View style={styles.container}>
							<View style={[styles.backdrop, { backgroundColor: themes[theme].backdropColor }]} />
							<Animated.View style={{ width: '100%', transform: [{ translateY }] }}>
								{ showContent ? this.renderContent() : null }
							</Animated.View>
						</View>
					</TouchableWithoutFeedback>
				</Modal>
				{button}
			</>
		);
	}
}
