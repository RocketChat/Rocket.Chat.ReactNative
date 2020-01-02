/* eslint-disable class-methods-use-this */
import React, { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import {
	uiKitMessage,
	UiKitParserMessage,
	uiKitModal,
	UiKitParserModal,
	BLOCK_CONTEXT
} from '@rocket.chat/ui-kit';

import Button from '../Button';
import TextInput from '../TextInput';

import { useBlockContext } from './utils';
import { themes } from '../../constants/colors';

import { Divider } from './Divider';
import { Section } from './Section';
import { Actions } from './Actions';
import { Image } from './Image';
import { Select } from './Select';
import { Context } from './Context';
import { MultiSelect } from './MultiSelect';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { Overflow } from './Overflow';
import { ThemeContext } from '../../theme';

const styles = StyleSheet.create({
	multiline: {
		height: 130
	}
});

class MessageParser extends UiKitParserMessage {
	button(element, context) {
		const {
			text, value, actionId, style
		} = element;
		const [{ loading }, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Button
				key={actionId}
				type={style}
				title={this.text(text)}
				loading={loading}
				onPress={() => action({ value })}
				theme={theme}
			/>
		);
	}

	divider() {
		const { theme } = useContext(ThemeContext);
		return <Divider theme={theme} />;
	}

	text({ text } = { text: '' }, context) {
		const { theme } = useContext(ThemeContext);
		const isContext = context === BLOCK_CONTEXT.CONTEXT;
		if (!isContext) {
			return text;
		}
		return <Text style={{ color: themes[theme].auxiliaryText }}>{text}</Text>;
	}

	section(args) {
		const { theme } = useContext(ThemeContext);
		return <Section {...args} theme={theme} parser={this} />;
	}

	actions(args) {
		const { theme } = useContext(ThemeContext);
		return <Actions {...args} theme={theme} parser={this} />;
	}

	overflow(element, context) {
		const [, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Overflow
				element={element}
				context={context}
				action={action}
				theme={theme}
				parser={this}
			/>
		);
	}

	datePicker(element, context) {
		const [, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return <DatePicker element={element} theme={theme} action={action} context={context} />;
	}

	image(element, context) {
		const { theme } = useContext(ThemeContext);
		return <Image element={element} theme={theme} context={context} />;
	}

	context(args) {
		const { theme } = useContext(ThemeContext);
		return <Context {...args} theme={theme} parser={this} />;
	}

	multiStaticSelect(element, context) {
		const [, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return <MultiSelect {...element} theme={theme} onChange={action} context={context} />;
	}

	staticSelect(element, context) {
		const [, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return <Select {...element} theme={theme} onChange={action} />;
	}

	selectInput(element, context) {
		const [, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return <Select {...element} theme={theme} onChange={action} />;
	}
}

class ModalParser extends UiKitParserModal {
	constructor() {
		super();
		Object.getOwnPropertyNames(MessageParser.prototype).forEach((method) => {
			ModalParser.prototype[method] = ModalParser.prototype[method] || MessageParser.prototype[method];
		});
	}

	input({
		element, blockId, appId, label, description, hint
	}) {
		const { theme } = useContext(ThemeContext);
		return (
			<Input
				parser={this}
				element={{ ...element, appId, blockId }}
				label={this.text(label)}
				description={this.text(description)}
				hint={this.text(hint)}
				theme={theme}
			/>
		);
	}

	image(element, context) {
		const { theme } = useContext(ThemeContext);
		return <Image element={element} theme={theme} context={context} />;
	}

	plainInput(element, context) {
		const [, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		const {
			multiline, actionId, placeholder, label, hint, description
		} = element;
		return (
			<TextInput
				id={actionId}
				hint={this.text(hint)}
				label={this.text(label)}
				description={this.text(description)}
				placeholder={this.text(placeholder)}
				onInput={action}
				multiline={multiline}
				onChangeText={value => action({ value })}
				inputStyle={multiline && styles.multiline}
				theme={theme}
			/>
		);
	}
}

export const messageParser = new MessageParser();
export const modalParser = new ModalParser();

export const UiKitMessage = uiKitMessage(messageParser);
export const UiKitModal = uiKitModal(modalParser);
