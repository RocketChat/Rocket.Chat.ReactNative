import { type ILoginResultAPI } from '@rocket.chat/sdk/interfaces';

import { type ILoginResultFromServer } from '../../definitions/ILoggedUser';

export const toLoginResult = (result: ILoginResultAPI | null | undefined): ILoginResultFromServer | undefined =>
	(result ?? undefined) as unknown as ILoginResultFromServer | undefined;
