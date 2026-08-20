import { type ILoginData } from '@rocket.chat/sdk/interfaces';

import { type ILoginResultFromServer } from '../../definitions/ILoggedUser';

export const toLoginResult = (result: ILoginData | null | undefined): ILoginResultFromServer | undefined =>
	(result ?? undefined) as unknown as ILoginResultFromServer | undefined;
