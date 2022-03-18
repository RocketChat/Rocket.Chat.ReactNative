export interface ICredentials {
	resume?: string;
	user?: string;
	password?: string;
	username?: string;
	ldapPass?: string;
	ldap?: boolean;
	ldapOptions?: object;
	crowdPassword?: string;
	crowd?: boolean;
	code?: string;
	totp?: {
		login: ICredentials;
		code: string;
	};
}
