import { type ICredentials as ISdkCredentials } from '@rocket.chat/sdk/interfaces';

import { type ICredentials } from '../../definitions/ICredentials';

export const toSdkCredentials = (credentials: ICredentials): ISdkCredentials => credentials as ISdkCredentials;
