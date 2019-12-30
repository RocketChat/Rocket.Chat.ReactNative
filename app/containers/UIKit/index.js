/* eslint-disable class-methods-use-this */
import React from 'react';
import { Text } from 'react-native';
import {
	uiKitMessage,
	UiKitParserMessage,
	uiKitModal,
	UiKitParserModal
} from '@rocket.chat/ui-kit';

import Button from '../Button';
import TextInput from '../TextInput';

import { useBlockContext } from './utils';

import { Divider } from './Divider';
import { Section } from './Section';
import { Actions } from './Actions';
import { Image } from './Image';
import { StaticSelect } from './StaticSelect';
import { Context } from './Context';
import { MultiSelect } from './MultiSelect';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { Overflow } from './Overflow';

const theme = 'light';

class MessageParser extends UiKitParserMessage {
	button(element, context) {
		const {
			text, value, actionId, style
		} = element;
		const [{ loading }, action] = useBlockContext(element, context);
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
		return <Divider />;
	}

	text({ text } = { text: '' }) {
		return <Text>{text}</Text>;
	}

	section(args) {
		return <Section {...args} parser={this} />;
	}

	actions(args) {
		return <Actions {...args} parser={this} />;
	}

	overflow(element, context) {
		const [, action] = useBlockContext(element, context);
		return (
			<Overflow
				element={element}
				context={context}
				action={action}
				parser={this}
			/>
		);
	}

	datePicker(element, context) {
		const [, action] = useBlockContext(element, context);
		return <DatePicker element={element} action={action} />;
	}

	image(element, context) {
		return <Image element={element} context={context} />;
	}

	context(args) {
		return <Context {...args} parser={this} />;
	}

	multiStaticSelect(element, context) {
		const [, action] = useBlockContext(element, context);
		return <MultiSelect {...element} onChange={action} />;
	}

	staticSelect(element, context) {
		const [, action] = useBlockContext(element, context);
		return <StaticSelect {...element} onChange={action} />;
	}

	selectInput() {
		return null;
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
		element, label, blockId, appId
	}) {
		return (
			<Input
				parser={this}
				element={{ ...element, appId, blockId }}
				label={this.text(label)}
			/>
		);
	}

	image(element, context) {
		return <Image element={element} context={context} />;
	}

	plainInput(element, context) {
		const [, action] = useBlockContext(element, context);
		const {
			multiline, actionId, placeholder, label
		} = element;
		return (
			<TextInput
				id={actionId}
				label={label}
				onInput={action}
				multiline={multiline}
				onChangeText={value => action({ value })}
				placeholder={this.text(placeholder)}
			/>
		);
	}
}

export const messageParser = new MessageParser();
export const modalParser = new ModalParser();

export const UiKitMessage = uiKitMessage(messageParser);
export const UiKitModal = uiKitModal(modalParser);
