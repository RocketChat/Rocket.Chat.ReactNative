import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { SettingsEndpoints as RestTypingsSettingsEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';
import type { ISetting, ISettingColor } from '../../ISetting';

type SettingsUpdateProps = SettingsUpdatePropDefault | SettingsUpdatePropsActions | SettingsUpdatePropsColor;

type SettingsUpdatePropsActions = {
	execute: boolean;
};

export const isSettingsUpdatePropsActions = (props: unknown): props is SettingsUpdatePropsActions =>
	typeof props === 'object' && props !== null && 'execute' in props;

type SettingsUpdatePropsColor = {
	editor: ISettingColor['editor'];
	value: ISetting['value'];
};

export const isSettingsUpdatePropsColor = (props: unknown): props is SettingsUpdatePropsColor =>
	typeof props === 'object' && props !== null && 'editor' in props && 'value' in props;

type SettingsUpdatePropDefault = {
	value: ISetting['value'];
};

export const isSettingsUpdatePropDefault = (props: unknown): props is SettingsUpdatePropDefault =>
	typeof props === 'object' && props !== null && 'value' in props;

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

export const isOauthCustomConfiguration = (config: any): config is OauthCustomConfiguration =>
	config &&
	typeof config === 'object' &&
	typeof config._id === 'string' &&
	typeof config.loginStyle === 'string' &&
	(config.loginStyle === 'popup' || config.loginStyle === 'redirect');

export type SettingsEndpoints = AdaptEndpoints<RestTypingsSettingsEndpoints> & {
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
