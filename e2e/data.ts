// @ts-ignore
// eslint-disable-next-line import/no-unresolved, import/extensions
import account from './e2e_account';
import random from './helpers/random';

export interface IUser {
	username: string;
	password: string;
	email: string;
}

export type TData = typeof data;
export type TDataKeys = keyof TData;
export type TDataChannels = keyof typeof data.channels;

const data = {
	server: 'https://mobile.rocket.chat',
	alternateServer: 'https://stable.rocket.chat',
	...account,
	channels: {
		detoxpublic: {
			name: 'detox-public'
		},
		detoxpublicprotected: {
			name: 'detox-public-protected',
			joinCode: '123'
		}
	},
	randomUser: (): { username: string; name: string; password: string; email: string } => {
		const randomVal = random();
		return {
			username: `user${randomVal}`,
			name: `user${randomVal}`, // FIXME: apply a different name
			password: `Password1@${randomVal}`,
			email: `mobile+${randomVal}@rocket.chat`
		};
	}
};

export default data;
