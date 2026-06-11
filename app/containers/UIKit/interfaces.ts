import type {
	BlockContext,
	FrameableIconElement,
	IconButtonElement,
	InfoCardBlock,
	Markdown,
	ModalView,
	PlainText,
	ServerInteraction,
	ViewBlockActionUserInteraction,
	ViewClosedUserInteraction,
	ViewSubmitUserInteraction
} from '@rocket.chat/ui-kit';
import { type ReactElement } from 'react';

import { type TSupportedThemes } from '../../theme';

export const ActionTypes = {
	ACTION: 'blockAction',
	SUBMIT: 'viewSubmit',
	CLOSED: 'viewClosed'
} as const;

export const ContainerTypes = {
	VIEW: 'view',
	MESSAGE: 'message'
} as const;

export const ModalActions = {
	MODAL: 'modal',
	OPEN: 'modal.open',
	CLOSE: 'modal.close',
	UPDATE: 'modal.update',
	ERRORS: 'errors'
} as const;

export type TActionType = (typeof ActionTypes)[keyof typeof ActionTypes];
export type TContainerType = (typeof ContainerTypes)[keyof typeof ContainerTypes];
export type TModalAction = (typeof ModalActions)[keyof typeof ModalActions];

export type IStateView = ViewSubmitUserInteraction['payload']['view']['state'];
export type IView = ModalView;
export interface Block {
	type: string;
	blockId?: string;
	element?: IElement;
	label?: string;
	appId?: string;
	optional?: boolean;
	elements?: IElement[];
}
export interface IElement {
	type: string;
	placeholder?: IText;
	actionId?: string;
	initialValue?: any;
	options?: Option[];
	text?: IText;
	value?: any;
	initialDate?: any;
	imageUrl?: string;
	appId?: string;
	blockId?: string;
	multiline?: boolean;
	icon?: string;
	variant?: 'default' | 'danger' | 'secondary' | 'warning';
	framed?: boolean;
	label?: string | IText;
	url?: string;
	callId?: string;
}
export type IText = {
	type?: 'plain_text' | 'mrkdwn';
	text: string;
	emoji?: boolean;
	i18n?: {
		key: string;
		args?: {
			[key: string]: string | number;
		};
	};
};
export interface Option {
	text: IText;
	value: string;
	imageUrl?: string;
}
export interface IButton extends IElement {
	type: 'button';
	text: IText;
	actionId: string;
	blockId: string;
	appId: string;
	style?: any;
}

export interface IContainer {
	type: TContainerType;
	id: string;
}

type TModalServerInteraction = Extract<ServerInteraction, { type: 'modal.open' | 'modal.update' | 'errors' }>;
export type IUserInteraction = Omit<TModalServerInteraction, 'type'>;
export type IEmitUserInteraction = TModalServerInteraction | ({ type: 'modal' } & IUserInteraction);

export interface ITriggerAction {
	type: TActionType;
	actionId?: string;
	appId?: string;
	container?: IContainer;
	value?: unknown;
	blockId?: string;
	rid?: string;
	mid?: string;
	viewId?: string;
	payload?: any;
	view?: IView;
	isCleared?: boolean;
}

export interface ITriggerBlockAction {
	container: IContainer;
	actionId: string;
	appId: string;
	value: unknown;
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

type TActionElement = IElement;
type TContextElement = IElement;
type TInputElement = IElement;
export type TElementAccessory = IElement & { blockId?: string; appId?: string };

export interface IParser {
	renderAccessories: (
		data: TElementAccessory | IElement,
		context: BlockContext,
		parser?: IParser,
		index?: number
	) => ReactElement | null;
	renderActions: (
		data: TActionElement | IElement,
		context: BlockContext,
		parser?: IParser,
		index?: number
	) => ReactElement | null;
	renderContext: (
		data: TContextElement | IElement,
		context: BlockContext,
		parser?: IParser,
		index?: number
	) => ReactElement | null;
	renderInputs: (data: TInputElement | IElement, context: BlockContext, parser?: IParser, index?: number) => ReactElement | null;
	text: (data: IText) => ReactElement | null;
	plain_text?: (data: PlainText | IText, context: BlockContext) => ReactElement | null;
	mrkdwn?: (data: Markdown | IText, context: BlockContext) => ReactElement | null;
	icon?: (data: IIcon, context: BlockContext) => ReactElement | null;
	icon_button?: (data: IIconButton, context: BlockContext) => ReactElement | null;
}

export interface IActions extends Block {
	blockId?: string;
	appId?: string;
	elements?: IElement[];
	parser?: IParser;
}

export interface IContext extends Block {
	elements?: IElement[];
	parser: IParser;
	theme?: TSupportedThemes;
}

export interface IDatePicker {
	element: IElement;
	language: string;
	action: (params: { value: unknown }) => Promise<void>;
	context: BlockContext;
	loading: boolean;
	value: string;
	error: string;
}

export interface IInput {
	element: IElement;
	parser: IParser;
	label?: string;
	description?: string;
	error?: string;
	hint?: string;
	theme: TSupportedThemes;
}

export interface IInputIndex {
	element: IElement;
	blockId?: string;
	appId?: string;
	label?: IText;
	description?: IText;
	hint?: IText;
}

export interface IThumb {
	element: IElement;
	size?: number;
}
export interface IImage {
	element: IElement;
	context?: BlockContext;
}

export interface IOverflow {
	element: IElement;
	action: (params: { value: unknown }) => Promise<void>;
	loading: boolean;
	parser: IParser;
	context: BlockContext;
}

interface PropsOption {
	onOptionPress: (params: { value: Option['value'] }) => void;
	parser: IParser;
	theme: TSupportedThemes;
}
export interface IOptions extends PropsOption {
	options: readonly Option[];
}

export interface IOption extends PropsOption {
	option: Option;
}

export interface IAccessoryComponent {
	element: TElementAccessory | IElement;
	parser: IParser;
}
export interface ISection extends Block {
	blockId: string;
	appId: string;
	text?: IText;
	accessory?: IElement;
	fields?: IText[];
	parser: IParser;
}

export interface IFields {
	parser: IParser;
	theme: TSupportedThemes;
	fields: readonly IText[];
}

export type IIcon = FrameableIconElement & {
	variant?: FrameableIconElement['variant'];
};

export type IIconButton = Omit<IconButtonElement, 'icon'> & {
	icon: IIcon;
	label?: string | IText;
};

export type IInfoCardRow = InfoCardBlock['rows'][number];
export interface IInfoCard extends Omit<InfoCardBlock, 'rows'> {
	rows: IInfoCardRow[];
	appId?: string;
	blockId?: string;
	parser: IParser;
}
export type IBlockActionForView = ViewBlockActionUserInteraction;
export type IViewClosedInteraction = ViewClosedUserInteraction;
