import { TextInput } from 'react-native';

import { TSupportedThemes } from '../theme';
import { ILivechatVisitor } from './ILivechatVisitor';
import { ISubscription } from './ISubscription';

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
	[index: string]: TextInput | null;
	name: TextInput | null;
	phone: TextInput | null;
	topic: TextInput | null;
}

export interface ICustomFields {
	visitor?: { [key: string]: string };
	livechat?: { [key: string]: string };
}
