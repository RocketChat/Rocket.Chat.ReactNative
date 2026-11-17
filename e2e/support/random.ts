const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

const pick = (characters: string) => characters[Math.floor(Math.random() * characters.length)];

export const random = (length = 10) => Array.from({ length }, () => pick(ALPHANUMERIC)).join('');

const generatePassword = (length = 10) => {
	let password = pick(LOWER) + pick(UPPER) + pick(DIGITS);
	while (password.length < length) {
		const character = pick(LOWER + UPPER + DIGITS);
		if (password.endsWith(character.repeat(3))) {
			continue;
		}
		password += character;
	}
	return password;
};

export interface RandomUser {
	username: string;
	name: string;
	password: string;
	email: string;
}

export const randomUser = (): RandomUser => {
	const suffix = random();
	return {
		username: `user${suffix}`,
		name: `user${suffix}`,
		password: generatePassword(),
		email: `mobile+${suffix}@rocket.chat`
	};
};

export const randomTeamName = () => `team${random()}`;
