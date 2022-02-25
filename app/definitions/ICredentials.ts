export interface ICredentials {
	password: string;
	username: string;
	email?: string;
	ldap?: boolean;
	ldapOptions?: object;
}
