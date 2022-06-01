export interface IOpenOAuth {
	url: string;
	ssoToken?: string;
	authType?: string;
}

export interface IItemService {
	_id: string;
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
