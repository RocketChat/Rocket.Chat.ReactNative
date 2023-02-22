// @ts-ignore
import account from './e2e_account';
import random from './helpers/random';

export interface IUser {
	username: string;
	password: string;
	email: string;
}

export type TData = typeof data;
export type TDataKeys = keyof TData;
export type TDataUsers = keyof typeof data.users;
export type TDataChannels = keyof typeof data.channels;
export type TUserRegularChannels = keyof typeof data.userRegularChannels;
export type TDataGroups = keyof typeof data.groups;
export type TDataTeams = keyof typeof data.teams;

const value = process.env.TEST_SESSION;
const data = {
	server: 'https://mobile.rocket.chat',
	...account,
	alternateServer: 'https://stable.rocket.chat',
	users: {
		regular: {
			username: `userone${value}`,
			password: '123',
			email: `mobile+regular${value}@rocket.chat`
		},
		alternate: {
			username: `usertwo${value}`,
			password: '123',
			email: `mobile+alternate${value}@rocket.chat`,
			totpSecret: 'NA4GOMZGHBQSK6KEFRVT62DMGJJGSYZJFZIHO3ZOGVXWCYZ6MMZQ'
		},
		profileChanges: {
			username: `userthree${value}`,
			password: '123',
			email: `mobile+profileChanges${value}@rocket.chat`
		},
		encryption: {
			username: `userencryption${value}`,
			password: '123',
			email: `mobile+encryption${value}@rocket.chat`
		},
		existing: {
			username: `existinguser${value}`,
			password: '123',
			email: `mobile+existing${value}@rocket.chat`
		},
		inapp: {
			username: `inappuser${value}`,
			password: '123',
			email: `mobile+inapp${value}@rocket.chat`
		}
	},
	channels: {
		detoxpublic: {
			name: 'detox-public'
		},
		detoxpublicprotected: {
			name: 'detox-public-protected',
			joinCode: '123'
		}
	},
	userRegularChannels: {
		detoxpublic: {
			name: `detox-public-${value}`
		}
	},
	groups: {
		private: {
			name: `detox-private-${value}`
		},
		alternate: {
			name: `detox-alternate-${value}`
		},
		alternate2: {
			name: `detox-alternate2-${value}`
		}
	},
	teams: {
		private: {
			name: `detox-team-${value}`
		}
	},
	registeringUser: {
		username: `newuser${value}`,
		password: `password${value}`,
		email: `mobile+registering${value}@rocket.chat`
	},
	registeringUser2: {
		username: `newusertwo${value}`,
		password: `passwordtwo${value}`,
		email: `mobile+registeringtwo${value}@rocket.chat`
	},
	registeringUser3: {
		username: `newuserthree${value}`,
		password: `passwordthree${value}`,
		email: `mobile+registeringthree${value}@rocket.chat`
	},
	registeringUser4: {
		username: `newuserfour${value}`,
		password: `passwordfour${value}`,
		email: `mobile+registeringfour${value}@rocket.chat`
	},
	random: value,
	randomUser: (): { username: string; password: string; email: string } => {
		const randomVal = random();
		return {
			username: `user${randomVal}`,
			password: '123',
			email: `mobile+${randomVal}@rocket.chat`
		};
	}
};

export default data;
