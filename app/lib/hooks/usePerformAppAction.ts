import { useCallback } from 'react';

import sdk from '../services/sdk';
import { IAppActionButton } from '../../definitions';
import { random } from '../methods/helpers';

export const usePerformAppAction = (rid?: string) =>
	useCallback(
		(appActionButton: IAppActionButton) => {
			const params = {
				type: 'actionButton',
				triggerId: random(17),
				actionId: appActionButton.actionId,
				payload: { context: appActionButton.context },
				rid
			} as const;

			sdk.post(`ui.interaction/${appActionButton.appId}`, params, 'apps');
		},
		[rid]
	);
