/* eslint-disable react-hooks/rules-of-hooks */
import React, { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import {
	UiKitParserMessage,
	UiKitParserModal,
	uiKitMessage,
	uiKitModal,
	BlockContext,
	type Markdown as IMarkdown,
	type PlainText
} from '@rocket.chat/ui-kit';

import Markdown, { MarkdownPreview } from '../markdown';
import Button from '../Button';
import { FormTextInput } from '../TextInput';
import { textParser, useBlockContext } from './utils';
import { themes } from '../../lib/constants/colors';
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
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { InfoCard } from './InfoCard';
import { ThemeContext } from '../../theme';
import {
	type IActions,
	type IButton,
	type IContext,
	type IElement,
	type IIcon,
	type IIconButton,
	type IInfoCard,
	type IInputIndex,
	type IParser,
	type ISection
} from './interfaces';
import VideoConferenceBlock from './VideoConferenceBlock';
import I18n from '../../i18n';

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

class MessageParser extends UiKitParserMessage<React.ReactElement> {
	constructor() {
		super();
		// Compatibility for @rocket.chat/ui-kit@0.39.0 where info_card is exported
		// but still missing from message allowed layout block types.
		this.allowedLayoutBlockTypes.add('info_card' as any);
	}

	get current() {
		return this as unknown as IParser;
	}

	plain_text(element: PlainText, context: BlockContext): React.ReactElement {
		const { theme } = useContext(ThemeContext);

		const isContext = context === BlockContext.CONTEXT;
		if (isContext) {
			return <MarkdownPreview msg={element.text} numberOfLines={0} />;
		}
		return <Text style={[styles.text, { color: themes[theme].fontDefault }]}>{element.text}</Text>;
	}

	mrkdwn(element: IMarkdown, context: BlockContext): React.ReactElement {
		const isContext = context === BlockContext.CONTEXT;
		if (isContext) {
			return <MarkdownPreview msg={element.text} numberOfLines={0} />;
		}
		return <Markdown msg={element.i18n ? I18n.t(element.i18n.key) : element.text} textStyle={{ fontSize: 14 }} />;
	}

	button(element: IButton, context: BlockContext): React.ReactElement {
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

	icon(element: IIcon, _context: BlockContext): React.ReactElement {
		return <Icon element={element} />;
	}

	icon_button(element: IIconButton, context: BlockContext): React.ReactElement {
		return <IconButton element={element} context={context} />;
	}

	divider(): React.ReactElement {
		return <Divider />;
	}

	section(args: ISection): React.ReactElement {
		return <Section {...args} parser={this.current} />;
	}

	actions(args: IActions): React.ReactElement {
		return <Actions {...args} parser={this.current} />;
	}

	overflow(element: IElement, context: BlockContext): React.ReactElement {
		const [{ loading }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
		return <Overflow element={element} context={context} loading={loading} action={action} parser={this.current} />;
	}

	datePicker(element: IElement, context: BlockContext): React.ReactElement {
		const [{ loading, value, error, language }, action] = useBlockContext(
			{ ...element, actionId: element.actionId || '' },
			context
		);
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

	image(element: IElement, context: BlockContext): React.ReactElement {
		return <Image element={element} context={context} />;
	}

	context(args: IContext): React.ReactElement {
		const { theme } = useContext(ThemeContext);
		return <Context {...args} theme={theme} parser={this.current} />;
	}

	info_card(args: IInfoCard): React.ReactElement {
		return <InfoCard {...args} parser={this.current} />;
	}

	multiStaticSelect(element: IElement, context: BlockContext): React.ReactElement {
		const [{ loading, value }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
		const valueFiltered = element?.options?.filter(option => value?.includes(option.value));
		return <MultiSelect {...element} value={valueFiltered} onChange={action} context={context} loading={loading} multiselect />;
	}

	staticSelect(element: IElement, context: BlockContext): React.ReactElement {
		const [{ loading, value }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
		return <Select {...element} value={value} onChange={action} loading={loading} />;
	}

	selectInput(element: IElement, context: BlockContext): React.ReactElement {
		const [{ loading, value }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
		return <MultiSelect {...element} value={value} onChange={action} context={context} loading={loading} />;
	}

	video_conf(element: IElement & { callId: string }): React.ReactElement {
		return <VideoConferenceBlock callId={element.callId} blockId={element.blockId!} />;
	}
}

// plain_text and mrkdwn functions are created in MessageParser and the ModalParser's constructor use the same functions
// @ts-ignore
class ModalParser extends UiKitParserModal<React.ReactElement> {
	constructor() {
		super();
		Object.getOwnPropertyNames(MessageParser.prototype).forEach(method => {
			// @ts-ignore
			ModalParser.prototype[method] = ModalParser.prototype[method] || MessageParser.prototype[method];
		});
	}

	get current() {
		return this as unknown as IParser;
	}

	input({ element, blockId, appId, label, description, hint }: IInputIndex, context: number): React.ReactElement {
		const [{ error }] = useBlockContext({ ...element, appId, blockId, actionId: element.actionId || '' }, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Input
				parser={this.current}
				element={{ ...element, appId, blockId }}
				{...(label && { label: plainText(label) })}
				{...(description && { description: plainText(description) })}
				{...(hint && { hint: plainText(hint) })}
				error={error}
				theme={theme}
			/>
		);
	}

	image(element: IElement, context: BlockContext): React.ReactElement {
		return <Image element={element} context={context} />;
	}

	plainInput(element: IElement, context: BlockContext): React.ReactElement {
		const [{ loading, value, error }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
		const { multiline, actionId, placeholder } = element;
		return (
			<FormTextInput
				key={actionId}
				{...(placeholder && { placeholder: plainText(placeholder) })}
				multiline={multiline}
				loading={loading}
				onChangeText={text => action({ value: text })}
				inputStyle={multiline && styles.multiline}
				containerStyle={styles.input}
				value={value}
				error={{ error }}
			/>
		);
	}
}

export const messageParser = new MessageParser();
export const modalParser = new ModalParser();

export const UiKitMessage = uiKitMessage(messageParser, { engine: 'rocket.chat' }) as any;
export const UiKitModal = uiKitModal(modalParser) as any;

export const UiKitComponent = ({ render, blocks }: any) => render(blocks);
