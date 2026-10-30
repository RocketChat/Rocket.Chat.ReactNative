import { type ComponentRef } from 'react';
import { type TextInput } from 'react-native';

import { type TSupportedThemes } from '../theme';
import { type ILivechatVisitor } from './ILivechatVisitor';
import { type ISubscription } from './ISubscription';

export interface ITitle {
	title: string;
	theme: TSupportedThemes;
}

export interface IInputs {
	livechatData: {
		[key: string]: any;
	};
	name: string;
	email: string;
	phone?: string;
	topic: string;
	tag: string[];
	[key: string]: any;
}

export type TParams = ILivechatVisitor & IInputs;

export interface ILivechat extends ISubscription {
	// Param dynamic depends on server
	sms?: string;
}

export interface IInputsRefs {
	[index: string]: ComponentRef<typeof TextInput> | null;
	name: ComponentRef<typeof TextInput> | null;
	phone: ComponentRef<typeof TextInput> | null;
	topic: ComponentRef<typeof TextInput> | null;
}

export interface ICustomFields {
	visitor?: { [key: string]: string };
	livechat?: { [key: string]: string };
}
