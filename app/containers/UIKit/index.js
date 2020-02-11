/* eslint-disable class-methods-use-this */
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import {
	uiKitMessage,
	UiKitParserMessage,
	uiKitModal,
	UiKitParserModal,
	BLOCK_CONTEXT
} from '@rocket.chat/ui-kit';

import Markdown from '../markdown';
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
	input: {
		marginBottom: 0
	},
	multiline: {
		height: 130
	},
	button: {
		marginBottom: 16
	}
});

const plainText = ({ text } = { text: '' }) => text;

class MessageParser extends UiKitParserMessage {
	text({ text, type } = { text: '' }, context) {
		const { theme } = useContext(ThemeContext);
		if (type !== 'mrkdwn') {
			return text;
		}

		const isContext = context === BLOCK_CONTEXT.CONTEXT;
		return (
			<Markdown
				msg={text}
				theme={theme}
				style={[isContext && { color: themes[theme].auxiliaryText }]}
				preview={isContext}
			/>
		);
	}

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
				style={styles.button}
				theme={theme}
			/>
		);
	}

	divider() {
		const { theme } = useContext(ThemeContext);
		return <Divider theme={theme} />;
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
		const [{ loading }, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Overflow
				element={element}
				context={context}
				loading={loading}
				action={action}
				theme={theme}
				parser={this}
			/>
		);
	}

	datePicker(element, context) {
		const [{
			loading, value, error, language
		}, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return (
			<DatePicker
				element={element}
				language={language}
				theme={theme}
				value={value}
				action={action}
				context={context}
				loading={loading}
				error={error}
			/>
		);
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
		const [{ loading, value }, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return (
			<MultiSelect
				{...element}
				theme={theme}
				value={value}
				onChange={action}
				context={context}
				loading={loading}
				multiselect
			/>
		);
	}

	staticSelect(element, context) {
		const [{ loading, value }, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Select
				{...element}
				theme={theme}
				value={value}
				onChange={action}
				loading={loading}
			/>
		);
	}

	selectInput(element, context) {
		const [{ loading, value }, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		return (
			<MultiSelect
				{...element}
				theme={theme}
				value={value}
				onChange={action}
				context={context}
				loading={loading}
			/>
		);
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
	}, context) {
		const [{ error }] = useBlockContext({ ...element, appId, blockId }, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Input
				parser={this}
				element={{ ...element, appId, blockId }}
				label={plainText(label)}
				description={plainText(description)}
				hint={plainText(hint)}
				error={error}
				theme={theme}
			/>
		);
	}

	image(element, context) {
		const { theme } = useContext(ThemeContext);
		return <Image element={element} theme={theme} context={context} />;
	}

	plainInput(element, context) {
		const [{ loading, value, error }, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		const { multiline, actionId, placeholder } = element;
		return (
			<TextInput
				id={actionId}
				placeholder={plainText(placeholder)}
				onInput={action}
				multiline={multiline}
				loading={loading}
				onChangeText={text => action({ value: text })}
				inputStyle={multiline && styles.multiline}
				containerStyle={styles.input}
				value={value}
				error={{ error }}
				theme={theme}
			/>
		);
	}
}

export const messageParser = new MessageParser();
export const modalParser = new ModalParser();

export const UiKitMessage = uiKitMessage(messageParser);
export const UiKitModal = uiKitModal(modalParser);

export const UiKitComponent = ({ render, blocks }) => render(blocks);
