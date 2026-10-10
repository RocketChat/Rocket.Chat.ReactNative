/* eslint-disable react-hooks/rules-of-hooks */
import { useContext, useMemo, type ReactElement } from 'react';
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
import Button from './Button';
import openLink from '~/lib/methods/helpers/openLink';
import { isSafeUrl } from './isSafeUrl';
import { FormTextInput } from '../TextInput';
import { textParser, useBlockContext } from './utils';
import { themes } from '~/lib/constants/colors';
import sharedStyles from '~/views/Styles';
import { Divider } from './Divider';
import { Section } from './Section';
import { Actions } from './Actions';
import { Image } from './Image';
import { Select } from './Select';
import { Context } from './Context';
import { type IItemData, MultiSelect, toItemArray } from './MultiSelect';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { Overflow } from './Overflow';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { InfoCard } from './InfoCard';
import { Preview } from './Preview';
import { Callout } from './Callout';
import { Checkbox } from './Checkbox';
import { RadioButton } from './RadioButton';
import { ToggleSwitch } from './ToggleSwitch';
import { LinearScale } from './LinearScale';
import { searchChannels, searchUsers } from './entitySearch';
import { ThemeContext, type TSupportedThemes } from '~/theme';
import {
	type IActions,
	type IButton,
	type ICallout,
	type IContext,
	type IElement,
	type IIcon,
	type IIconButton,
	type IInfoCard,
	type IInputIndex,
	type IParser,
	type IPreview,
	type ISection,
	type Option
} from './interfaces';
import VideoConferenceBlock from './VideoConferenceBlock';
import I18n from '~/i18n';

const styles = StyleSheet.create({
	input: {
		marginBottom: 0
	},
	multiline: {
		height: 130
	},
	text: {
		fontSize: 16,
		lineHeight: 22,
		textAlignVertical: 'center',
		...sharedStyles.textRegular
	}
});

const plainText = ({ text } = { text: '' }) => text;

type TButtonStyle = 'primary' | 'secondary' | 'danger' | 'warning' | 'success';

const resolveButtonAppearance = (
	style: TButtonStyle | undefined,
	theme: TSupportedThemes
): { type: 'primary' | 'secondary'; backgroundColor: string | undefined; color: string | undefined } => {
	switch (style) {
		case 'danger':
			return {
				type: 'secondary',
				backgroundColor: themes[theme].buttonBackgroundDangerDefault,
				color: themes[theme].fontWhite
			};
		case 'success':
			return {
				type: 'secondary',
				backgroundColor: themes[theme].buttonBackgroundSuccessDefault,
				color: themes[theme].fontWhite
			};
		case 'warning':
			return {
				type: 'secondary',
				backgroundColor: themes[theme].statusBackgroundWarning,
				color: themes[theme].statusFontWarning
			};
		case 'secondary':
			return { type: 'secondary', backgroundColor: undefined, color: undefined };
		default:
			return {
				type: 'primary',
				backgroundColor: undefined,
				color: undefined
			};
	}
};

const entitySelect = (
	element: IElement,
	context: BlockContext,
	onSearch: (keyword: string) => IItemData[] | Promise<IItemData[] | undefined>,
	multiselect?: boolean
): ReactElement => {
	const [{ loading, value }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
	const items = useMemo(() => toItemArray(value), [value]);
	return (
		<MultiSelect
			options={element.options}
			placeholder={element.placeholder}
			value={items}
			onChange={action}
			onSearch={onSearch}
			context={context}
			loading={loading}
			multiselect={multiselect}
		/>
	);
};

class MessageParser extends UiKitParserMessage<ReactElement> {
	constructor() {
		super();
		this.allowedLayoutBlockTypes.add('info_card' as any);
		this.allowedLayoutBlockTypes.add('input' as any);
	}

	get current() {
		return this as unknown as IParser;
	}

	plain_text(element: PlainText, context: BlockContext): ReactElement {
		const { theme } = useContext(ThemeContext);

		const isContext = context === BlockContext.CONTEXT;
		if (isContext) {
			return <MarkdownPreview msg={element.text} numberOfLines={0} />;
		}
		return <Text style={[styles.text, { color: themes[theme].fontDefault }]}>{element.text}</Text>;
	}

	mrkdwn(element: IMarkdown, context: BlockContext): ReactElement {
		const isContext = context === BlockContext.CONTEXT;
		if (isContext) {
			return <MarkdownPreview msg={element.text} numberOfLines={0} />;
		}
		return <Markdown msg={element.i18n ? I18n.t(element.i18n.key) : element.text} />;
	}

	button(element: IButton, context: BlockContext): ReactElement {
		const { text, value, actionId, style, secondary, url } = element;
		const { theme } = useContext(ThemeContext);
		const [{ loading }, action] = useBlockContext(element, context);
		const appearance = resolveButtonAppearance(style === 'secondary' || secondary ? 'secondary' : style, theme);
		const onPress = () => {
			action({ value });
			if (url && isSafeUrl(url)) {
				openLink(url, theme);
			}
		};
		return (
			<Button
				key={actionId}
				type={appearance.type}
				backgroundColor={appearance.backgroundColor}
				color={appearance.color}
				title={textParser([text])}
				loading={loading}
				onPress={onPress}
			/>
		);
	}

	icon(element: IIcon, _context: BlockContext): ReactElement {
		return <Icon element={element} />;
	}

	icon_button(element: IIconButton, context: BlockContext): ReactElement {
		return <IconButton element={element} context={context} />;
	}

	divider(): ReactElement {
		return <Divider />;
	}

	section(args: ISection): ReactElement {
		return <Section {...args} parser={this.current} />;
	}

	actions(args: IActions): ReactElement {
		return <Actions {...args} parser={this.current} />;
	}

	overflow(element: IElement, context: BlockContext): ReactElement {
		const [{ loading }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
		return <Overflow element={element} context={context} loading={loading} action={action} parser={this.current} />;
	}

	datePicker(element: IElement, context: BlockContext): ReactElement {
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

	image(element: IElement, context: BlockContext): ReactElement {
		return <Image element={element} context={context} />;
	}

	context(args: IContext): ReactElement {
		const { theme } = useContext(ThemeContext);
		return <Context {...args} theme={theme} parser={this.current} />;
	}

	info_card(args: IInfoCard): ReactElement {
		return <InfoCard {...args} parser={this.current} />;
	}

	preview(args: IPreview): ReactElement {
		return (
			<Preview
				title={args.title}
				description={args.description}
				thumb={args.thumb}
				preview={args.preview}
				footer={args.footer}
				parser={this.current}
			/>
		);
	}

	callout(args: ICallout): ReactElement {
		return (
			<Callout
				title={args.title}
				text={args.text}
				variant={args.variant}
				accessory={args.accessory}
				appId={args.appId}
				blockId={args.blockId}
				parser={this.current}
			/>
		);
	}

	input({ element, blockId, appId, label, description, hint }: IInputIndex, context: number): ReactElement {
		const [{ error }] = useBlockContext({ ...element, appId, blockId, actionId: element.actionId || '' }, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Input
				parser={this.current}
				element={{ ...element, appId, blockId }}
				label={label ? plainText(label) : undefined}
				description={description ? plainText(description) : undefined}
				hint={hint ? plainText(hint) : undefined}
				error={error}
				theme={theme}
			/>
		);
	}

	checkbox(element: IElement, context: BlockContext): ReactElement {
		const { initialOptions } = element as unknown as { initialOptions?: Option[] };
		const initialValue = useMemo(() => initialOptions?.map(option => option.value), [initialOptions]);
		const [{ loading, value }, action] = useBlockContext({ ...element, initialValue, actionId: element.actionId || '' }, context);
		return <Checkbox element={element} value={value} action={action} loading={loading} />;
	}

	radio_button(element: IElement, context: BlockContext): ReactElement {
		const { initialOption } = element as unknown as { initialOption?: Option };
		const [{ loading, value }, action] = useBlockContext(
			{ ...element, initialValue: initialOption?.value, actionId: element.actionId || '' },
			context
		);
		return <RadioButton element={element} value={value} action={action} loading={loading} />;
	}

	toggle_switch(element: IElement, context: BlockContext): ReactElement {
		const { initialOptions } = element as unknown as { initialOptions?: Option[] };
		const initialValue = useMemo(() => initialOptions?.map(option => option.value), [initialOptions]);
		const [{ loading, value }, action] = useBlockContext({ ...element, initialValue, actionId: element.actionId || '' }, context);
		return <ToggleSwitch element={element} value={value} action={action} loading={loading} />;
	}

	linear_scale(element: IElement, context: BlockContext): ReactElement {
		const { initialValue } = element as unknown as { initialValue?: number };
		const [{ loading, value }, action] = useBlockContext({ ...element, initialValue, actionId: element.actionId || '' }, context);
		return <LinearScale element={element} value={value} action={action} loading={loading} />;
	}

	time_picker(element: IElement, context: BlockContext): ReactElement {
		const [{ loading, value, error, language }, action] = useBlockContext(
			{ ...element, actionId: element.actionId || '' },
			context
		);
		return (
			<TimePicker
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

	multiStaticSelect(element: IElement, context: BlockContext): ReactElement {
		const [{ loading, value }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
		const valueFiltered = useMemo(() => {
			const selectedValues = new Set(value);
			return element?.options?.filter(option => selectedValues.has(option.value));
		}, [element?.options, value]);
		return <MultiSelect {...element} value={valueFiltered} onChange={action} context={context} loading={loading} multiselect />;
	}

	staticSelect(element: IElement, context: BlockContext): ReactElement {
		const [{ loading, value }, action] = useBlockContext({ ...element, actionId: element.actionId || '' }, context);
		return <Select {...element} value={value} onChange={action} loading={loading} />;
	}

	users_select(element: IElement, context: BlockContext): ReactElement {
		return entitySelect(element, context, searchUsers);
	}

	channels_select(element: IElement, context: BlockContext): ReactElement {
		return entitySelect(element, context, searchChannels);
	}

	multi_users_select(element: IElement, context: BlockContext): ReactElement {
		return entitySelect(element, context, searchUsers, true);
	}

	multi_channels_select(element: IElement, context: BlockContext): ReactElement {
		return entitySelect(element, context, searchChannels, true);
	}

	video_conf(element: IElement & { callId: string }): ReactElement {
		return <VideoConferenceBlock callId={element.callId} blockId={element.blockId!} />;
	}
}

// @ts-ignore
class ModalParser extends UiKitParserModal<ReactElement> {
	constructor() {
		super();
		Object.getOwnPropertyNames(MessageParser.prototype).forEach(method => {
			if (method === 'constructor' || method === 'current') {
				return;
			}
			// @ts-ignore
			ModalParser.prototype[method] = ModalParser.prototype[method] || MessageParser.prototype[method];
		});
	}

	get current() {
		return this as unknown as IParser;
	}

	input({ element, blockId, appId, label, description, hint }: IInputIndex, context: number): ReactElement {
		const [{ error }] = useBlockContext({ ...element, appId, blockId, actionId: element.actionId || '' }, context);
		const { theme } = useContext(ThemeContext);
		return (
			<Input
				parser={this.current}
				element={{ ...element, appId, blockId }}
				label={label ? plainText(label) : undefined}
				description={description ? plainText(description) : undefined}
				hint={hint ? plainText(hint) : undefined}
				error={error}
				theme={theme}
			/>
		);
	}

	image(element: IElement, context: BlockContext): ReactElement {
		return <Image element={element} context={context} />;
	}

	plainInput(element: IElement, context: BlockContext): ReactElement {
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
