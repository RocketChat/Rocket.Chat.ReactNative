import { IServices } from '../../selectors/login';

export interface IOpenOAuth {
	url: string;
	ssoToken?: string;
	authType?: string;
}

export interface IItemService {
	name: string;
	service: string;
	authType: string;
	buttonColor: string;
	buttonLabelColor: string;
	clientConfig: { provider: string };
	serverURL: string;
	authorizePath: string;
	clientId: string;
	scope: string;
}

export interface IFunctions {
	services: IServices;
	server: string;
	urlOption?: string;
}

export interface IOauthProvider {
	[key: string]: ({ services, server }: IFunctions) => void;
	facebook: ({ services, server }: IFunctions) => void;
	github: ({ services, server }: IFunctions) => void;
	gitlab: ({ services, server }: IFunctions) => void;
	google: ({ services, server }: IFunctions) => void;
	linkedin: ({ services, server }: IFunctions) => void;
	'meteor-developer': ({ services, server }: IFunctions) => void;
	twitter: ({ services, server }: IFunctions) => void;
	wordpress: ({ services, server }: IFunctions) => void;
}
