import { TThemeMode } from '../../definitions/ITheme';

export type TTextBlock = 'plain_text' | 'plain_text_input';

export type TButton = 'button';

export type TInput = 'input';

type TTypes = TTextBlock | TButton | TInput | 'divider' | 'static_select' | 'actions' | 'image' | 'overflow';

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
	type: TTypes;
	blockId: string;
	element?: IElement;
	label?: IText;
	appId: string;
	optional?: boolean;
	elements?: IElement[];
}

export interface IElement {
	type: TTypes;
	placeholder?: IText;
	actionId: string;
	initialValue?: string;
	options?: Option[];
	text?: IText;
	value?: string;
	initial_date?: any;
	imageUrl?: string;
	blockId?: string;
}

export interface IText {
	type: TTextBlock;
	text: string;
	emoji?: boolean;
}

export interface Option {
	text: IText;
	value: string;
}

export interface IButton {
	type: TButton;
	text: IText;
	actionId: string;
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
interface IParser {
	renderAccessories: (data: TElementAccessory, context: string, parser: IParser) => JSX.Element;
	renderActions: (data: Block, context: string, parser: IParser) => JSX.Element;
	renderContext: (data: IElement, context: string, parser: IParser) => JSX.Element;
	renderInputs: (data: Partial<IElement>, context: string, parser: IParser) => JSX.Element;
	text: (data: IText) => JSX.Element;
}
export interface IActions extends Block {
	parser?: IParser;
	theme: TThemeMode;
}

export interface IContext extends Block {
	parser?: IParser;
}

export interface IDatePicker extends Block {
	language: string;
	action: Function;
	context: number;
	loading: boolean;
	value: string;
	error: string;
	theme: TThemeMode;
}

export interface IInput extends Block {
	parser: IParser;
	description: string;
	error: string;
	hint: string;
	theme: TThemeMode;
}

export interface IThumb {
	element: IElement;
	size?: number;
}
export interface IImage {
	element: IElement;
	theme: TThemeMode;
	context?: number;
}

// UiKit/Overflow
export interface IOverflow extends Block {
	action: Function;
	loading: boolean;
	parser: IParser;
	theme: TThemeMode;
	context: number;
}

interface PropsOption {
	onOptionPress: Function;
	parser: IParser;
	theme: TThemeMode;
}
export interface IOptions extends PropsOption {
	options: Option[];
}

export interface IOption extends PropsOption {
	option: Option;
}

// UiKit/Section
interface IAccessory {
	type: TTypes;
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
	theme: TThemeMode;
	fields?: any[];
}

export interface IFields {
	parser: IParser;
	theme: TThemeMode;
	fields: any[];
}
