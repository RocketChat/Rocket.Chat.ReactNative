/* eslint-disable react-hooks/rules-of-hooks */
import React, { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import { BLOCK_CONTEXT, UiKitParserMessage, UiKitParserModal, uiKitMessage, uiKitModal } from '@rocket.chat/ui-kit';

import Markdown, { MarkdownPreview } from '../markdown';
import Button from '../Button';
import FormTextInput from '../TextInput/FormTextInput';
import { textParser, useBlockContext } from './utils';
import { themes } from '../../lib/constants';
import sharedStyles from '../../views/Styles';
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
import { BlockContext, IActions, IButton, IElement, IInputIndex, IParser, ISection, IText } from './interfaces';

const styles = StyleSheet.create({
	input: {
		marginBottom: 0
	},
	multiline: {
		height: 130
	},
	button: {
		marginBottom: 16
	},
	text: {
		fontSize: 16,
		lineHeight: 22,
		textAlignVertical: 'center',
		...sharedStyles.textRegular
	}
});

const plainText = ({ text } = { text: '' }) => text;

class MessageParser extends UiKitParserMessage {
	get current() {
		return this as unknown as IParser;
	}

	text({ text, type }: Partial<IText> = { text: '' }, context: BlockContext) {
		const { theme } = useContext(ThemeContext);
		if (type !== 'mrkdwn') {
			return <Text style={[styles.text, { color: themes[theme].bodyText }]}>{text}</Text>;
		}

		const isContext = context === BLOCK_CONTEXT.CONTEXT;
		if (isContext) {
			return <MarkdownPreview msg={text} style={[isContext && { color: themes[theme].auxiliaryText }]} numberOfLines={0} />;
		}
		return <Markdown msg={text} theme={theme} style={[isContext && { color: themes[theme].auxiliaryText }]} />;
	}

	button(element: IButton, context: BlockContext) {
		const { text, value, actionId, style } = element;
		const [{ loading }, action] = useBlockContext(element, context);
		return (
			<Button
				key={actionId}
				type={style}
				title={textParser([text])}
				loading={loading}
				onPress={() => action({ value })}
				style={styles.button}
			/>
		);
	}

	divider() {
		return <Divider />;
	}

	section(args: ISection) {
		return <Section {...args} parser={this.current} />;
	}

	actions(args: IActions) {
		return <Actions {...args} parser={this.current} />;
	}

	overflow(element: IElement, context: BlockContext) {
		const [{ loading }, action] = useBlockContext(element, context);
		return <Overflow element={element} context={context} loading={loading} action={action} parser={this.current} />;
	}

	datePicker(element: IElement, context: BlockContext) {
		const [{ loading, value, error, language }, action] = useBlockContext(element, context);
		return (
			<DatePicker
				element={element}
				language={language}
				value={value}
				action={action}
				context={context}
				loading={loading}
				error={error}
			/>
		);
	}

	image(element: IElement, context: BlockContext) {
		return <Image element={element} context={context} />;
	}

	context(args: any) {
		const { theme } = useContext(ThemeContext);
		return <Context {...args} theme={theme} parser={this} />;
	}

	multiStaticSelect(element: IElement, context: BlockContext) {
		const [{ loading, value }, action] = useBlockContext(element, context);
		return <MultiSelect {...element} value={value} onChange={action} context={context} loading={loading} multiselect />;
	}

	staticSelect(element: IElement, context: BlockContext) {
		const [{ loading, value }, action] = useBlockContext(element, context);
		return <Select {...element} value={value} onChange={action} loading={loading} />;
	}

	selectInput(element: IElement, context: BlockContext) {
		const [{ loading, value }, action] = useBlockContext(element, context);
		return <MultiSelect {...element} value={value} onChange={action} context={context} loading={loading} />;
	}
}

class ModalParser extends UiKitParserModal {
	constructor() {
		super();
		Object.getOwnPropertyNames(MessageParser.prototype).forEach(method => {
			ModalParser.prototype[method] = ModalParser.prototype[method] || MessageParser.prototype[method];
		});
	}

	get current() {
		return this as unknown as IParser;
	}

	input({ element, blockId, appId, label, description, hint }: IInputIndex, context: number) {
		const [{ error }] = useBlockContext({ ...element, appId, blockId }, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Input
				parser={this.current}
				element={{ ...element, appId, blockId }}
				label={plainText(label)}
				description={plainText(description)}
				hint={plainText(hint)}
				error={error}
				theme={theme}
			/>
		);
	}

	image(element: IElement, context: BlockContext) {
		return <Image element={element} context={context} />;
	}

	plainInput(element: IElement, context: BlockContext) {
		const [{ loading, value, error }, action] = useBlockContext(element, context);
		const { theme } = useContext(ThemeContext);
		const { multiline, actionId, placeholder } = element;
		return (
			<FormTextInput
				key={actionId}
				placeholder={plainText(placeholder)}
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

export const UiKitComponent = ({ render, blocks }: any) => render(blocks);
