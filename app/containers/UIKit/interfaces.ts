import { BlockContext } from '@rocket.chat/ui-kit';

import { TSupportedThemes } from '../../theme';

export enum ElementTypes {
	IMAGE = 'image',
	BUTTON = 'button',
	STATIC_SELECT = 'static_select',
	MULTI_STATIC_SELECT = 'multi_static_select',
	CONVERSATION_SELECT = 'conversations_select',
	CHANNEL_SELECT = 'channels_select',
	USER_SELECT = 'users_select',
	OVERFLOW = 'overflow',
	DATEPICKER = 'datepicker',
	PLAIN_TEXT_INPUT = 'plain_text_input',
	SECTION = 'section',
	DIVIDER = 'divider',
	ACTIONS = 'actions',
	CONTEXT = 'context',
	FIELDS = 'fields',
	INPUT = 'input',
	PLAIN_TEXT = 'plain_text',
	TEXT = 'text',
	MARKDOWN = 'mrkdwn'
}

export enum ActionTypes {
	ACTION = 'blockAction',
	SUBMIT = 'viewSubmit',
	CLOSED = 'viewClosed'
}

export enum ContainerTypes {
	VIEW = 'view',
	MESSAGE = 'message'
}

export enum ModalActions {
	MODAL = 'modal',
	OPEN = 'modal.open',
	CLOSE = 'modal.close',
	UPDATE = 'modal.update',
	ERRORS = 'errors'
}

export interface IStateView {
	[key: string]: { [settings: string]: string | number };
}

export interface IView {
	appId: string;
	type: ModalActions;
	id: string;
	title: IText;
	submit: IButton;
	close: IButton;
	blocks: Block[];
	showIcon: boolean;
	state?: IStateView;
}

export interface Block {
	type: ElementTypes;
	blockId: string;
	element?: IElement;
	label?: string;
	appId: string;
	optional?: boolean;
	elements?: IElement[];
}

export interface IElement {
	type: ElementTypes;
	placeholder?: IText;
	actionId: string;
	initialValue?: string;
	options?: Option[];
	text?: IText;
	value?: string;
	initial_date?: any;
	imageUrl?: string;
	appId?: string;
	blockId?: string;
	multiline?: boolean;
}

export interface IText {
	type?: ElementTypes;
	text: string;
	emoji?: boolean;
}

export interface Option {
	text: IText;
	value: string;
	imageUrl?: string;
}

export interface IButton {
	type: ElementTypes;
	text: IText;
	actionId: string;
	blockId: string;
	appId: string;
	value?: any;
	style?: any;
}

export interface IContainer {
	type: ContainerTypes;
	id: string;
}

// methods/actions
export interface IUserInteraction {
	triggerId: string;
	appId?: string;
	viewId?: string;
	view: IView;
}

export interface IEmitUserInteraction extends IUserInteraction {
	type: ModalActions;
}

export interface ITriggerAction {
	type: ActionTypes;
	actionId?: string;
	appId?: string;
	container?: IContainer;
	value?: number;
	blockId?: string;
	rid?: string;
	mid?: string;
	viewId?: string;
	payload?: any;
	view?: IView;
}

export interface ITriggerBlockAction {
	container: IContainer;
	actionId: string;
	appId: string;
	value: number;
	blockId?: string;
	mid?: string;
	rid?: string;
}

export interface ITriggerSubmitView {
	viewId: string;
	appId: string;
	payload: {
		view: {
			id: string;
			state: IStateView;
		};
	};
}

export interface ITriggerCancel {
	view: IView;
	appId: string;
	viewId: string;
	isCleared: boolean;
}

// UiKit components
export interface IParser {
	renderAccessories: (data: TElementAccessory, context: BlockContext, parser: IParser) => JSX.Element;
	renderActions: (data: Block, context: BlockContext, parser: IParser) => JSX.Element;
	renderContext: (data: IElement, context: BlockContext, parser: IParser) => JSX.Element;
	renderInputs: (data: Partial<IElement>, context: BlockContext, parser: IParser) => JSX.Element;
	text: (data: IText) => JSX.Element;
}
export interface IActions extends Block {
	parser?: IParser;
}

export interface IContext extends Block {
	parser: IParser;
}

export interface IDatePicker extends Partial<Block> {
	language: string;
	action: Function;
	context: number;
	loading: boolean;
	value: string;
	error: string;
}

export interface IInput extends Partial<Block> {
	parser: IParser;
	description: string;
	error: string;
	hint: string;
	theme: TSupportedThemes;
}

export interface IInputIndex {
	element: IElement;
	blockId: string;
	appId: string;
	label: IText;
	description: IText;
	hint: IText;
}

export interface IThumb {
	element: IElement;
	size?: number;
}
export interface IImage {
	element: IElement;
	context?: BlockContext;
}

// UiKit/Overflow
export interface IOverflow extends Partial<Block> {
	action: Function;
	loading: boolean;
	parser: IParser;
	context: number;
}

interface PropsOption {
	onOptionPress: Function;
	parser: IParser;
	theme: TSupportedThemes;
}
export interface IOptions extends PropsOption {
	options: Option[];
}

export interface IOption extends PropsOption {
	option: Option;
}

// UiKit/Section
interface IAccessory {
	type: ElementTypes;
	actionId: string;
	value: number;
	text: IText;
}

type TElementAccessory = IAccessory & { blockId: string; appId: string };
export interface IAccessoryComponent {
	element: TElementAccessory;
	parser: IParser;
}
export interface ISection {
	blockId: string;
	appId: string;
	text?: IText;
	accessory?: IAccessory;
	parser: IParser;
	fields?: any[];
}

export interface IFields {
	parser: IParser;
	theme: TSupportedThemes;
	fields: any[];
}
