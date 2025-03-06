import { ReactElement } from 'react';

import { IServices } from '../../selectors/login';
import { TIconsName } from '../CustomIcon';

type TAuthType = 'oauth' | 'oauth_custom' | 'saml' | 'cas' | 'apple';

type TServiceName = 'facebook' | 'github' | 'gitlab' | 'google' | 'linkedin' | 'meteor-developer' | 'twitter' | 'wordpress';
export interface IOpenOAuth {
	url: string;
	ssoToken?: string;
	authType?: TAuthType;
}

export interface IItemService {
	_id: string;
	name: TServiceName;
	service: string;
	authType: TAuthType;
	buttonColor: string;
	buttonLabelColor: string;
	clientConfig: { provider: string };
	serverURL: string;
	authorizePath: string;
	clientId: string;
	scope: string;
}

export interface IServiceLogin {
	service: IItemService;
	server: string;
	urlOption?: string;
}

export interface IOauthProvider {
	[key: string]: ({ service, server }: IServiceLogin) => void;
	facebook: ({ service, server }: IServiceLogin) => void;
	github: ({ service, server }: IServiceLogin) => void;
	gitlab: ({ service, server }: IServiceLogin) => void;
	google: ({ service, server }: IServiceLogin) => void;
	linkedin: ({ service, server }: IServiceLogin) => void;
	'meteor-developer': ({ service, server }: IServiceLogin) => void;
	twitter: ({ service, server }: IServiceLogin) => void;
	wordpress: ({ service, server }: IServiceLogin) => void;
}

export interface IServiceList {
	services: IServices;
	CAS_enabled: boolean;
	CAS_login_url: string;
	Gitlab_URL: string;
	server: string;
}

export interface IServicesSeparator {
	services: IServices;
	separator: boolean;
	collapsed: boolean;
	onPress(): void;
}

export interface IButtonService {
	name: string;
	authType: TAuthType;
	onPress: () => void;
	backgroundColor: string;
	buttonText: ReactElement;
	icon: TIconsName;
	accessibilityLabel?: string;
}
