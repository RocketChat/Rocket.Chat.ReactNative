import '@rocket.chat/sdk/lib/api/api';

declare module '@rocket.chat/sdk/lib/api/api' {
	interface IClient {
		host: string;
	}
}
