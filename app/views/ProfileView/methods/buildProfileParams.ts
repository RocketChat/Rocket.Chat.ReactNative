import { sha256 } from 'js-sha256';

import { type IProfileParams, type IUser } from '../../../definitions';

interface IProfileFormValues {
	name: string;
	username: string;
	email: string | null;
	currentPassword: string | null;
	bio?: string;
	nickname?: string;
}

const buildProfileParams = (formValues: IProfileFormValues, user: IUser): IProfileParams => {
	const { name, username, email, currentPassword, bio, nickname } = formValues;
	const params = {} as IProfileParams;

	if (user.name !== name) params.name = name;
	if (user.username !== username) params.username = username;
	if (user.emails?.[0].address !== email) params.email = email;
	if (user.bio !== bio) params.bio = bio;
	if (user.nickname !== nickname) params.nickname = nickname;
	if (currentPassword) params.currentPassword = sha256(currentPassword);

	return params;
};

export default buildProfileParams;
