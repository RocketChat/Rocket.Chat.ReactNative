export type TTextBlock = 'plain_text' | 'plain_text_input';

export type TButton = 'button';

export type TInput = 'input';

type TTypes = TTextBlock | TButton | TInput | 'divider' | 'static_select' | 'actions';

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

// METHODS/ACTIONS
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
