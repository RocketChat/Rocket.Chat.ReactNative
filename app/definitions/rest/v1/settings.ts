import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { SettingsEndpoints as RestTypingsSettingsEndpoints } from '@rocket.chat/rest-typings';

import type { ISetting, ISettingColor } from '../../ISetting';

type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

type AdaptSettingsEndpoints<T> = {
	[K in keyof T as K extends `/v1/settings/:_id` ? `settings/:_id` : RemoveV1Prefix<K & string>]: T[K];
};

type SettingsUpdateProps = SettingsUpdatePropDefault | SettingsUpdatePropsActions | SettingsUpdatePropsColor;

type SettingsUpdatePropsActions = {
	execute: boolean;
};

export const isSettingsUpdatePropsActions = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropsActions =>
	'execute' in props;

type SettingsUpdatePropsColor = {
	editor: ISettingColor['editor'];
	value: ISetting['value'];
};

export const isSettingsUpdatePropsColor = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropsColor =>
	'editor' in props && 'value' in props;

type SettingsUpdatePropDefault = {
	value: ISetting['value'];
};

export const isSettingsUpdatePropDefault = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropDefault =>
	'value' in props;

export type OauthCustomConfiguration = LoginServiceConfiguration & {
	_id: string;
	custom: unknown;
	serverURL: unknown;
	tokenPath: unknown;
	identityPath: unknown;
	authorizePath: unknown;
	scope: unknown;
	loginStyle: 'popup' | 'redirect';
	tokenSentVia: unknown;
	identityTokenSentVia: unknown;
	keyField: unknown;
	usernameField: unknown;
	emailField: unknown;
	nameField: unknown;
	avatarField: unknown;
	rolesClaim: unknown;
	groupsClaim: unknown;
	mapChannels: unknown;
	channelsMap: unknown;
	channelsAdmin: unknown;
	mergeUsers: unknown;
	mergeRoles: unknown;
	accessTokenParam: unknown;
	showButton: unknown;
	clientConfig: unknown;
	buttonLabelText: unknown;
	buttonLabelColor: unknown;
	buttonColor: unknown;
};

export const isOauthCustomConfiguration = (config: any): config is OauthCustomConfiguration => Boolean(config);

export type SettingsEndpoints = AdaptSettingsEndpoints<RestTypingsSettingsEndpoints> & {
	'settings.oauth': {
		GET: () => {
			services: Partial<OauthCustomConfiguration>[];
		};
	};

	'settings/:_id': {
		GET: () => Pick<ISetting, '_id' | 'value'>;
		POST: (params: SettingsUpdateProps) => void;
	};
};
