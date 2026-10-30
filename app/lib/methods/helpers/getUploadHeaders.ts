import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { type IUser } from '~/definitions';
import { type TUploadHeaders } from './fileUpload/definitions';

export const getUploadHeaders = ({ id, token }: Partial<Pick<IUser, 'id' | 'token'>>): TUploadHeaders => ({
	...RocketChatSettings.customHeaders,
	'Content-Type': 'multipart/form-data',
	'X-Auth-Token': token,
	'X-User-Id': id
});
