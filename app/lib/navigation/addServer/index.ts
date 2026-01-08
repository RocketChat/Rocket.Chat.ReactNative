import { batch } from 'react-redux';

import { appStart } from '../../../actions/app';
import { serverInitAdd } from '../../../actions/server';
import { RootEnum } from '../../../definitions';
import { logEvent, events } from '../../methods/helpers/log';
import { type AppDispatch } from '../../store';

export function navigateToAddServer(dispatch: AppDispatch, previousServer: string) {
	logEvent(events.RL_ADD_SERVER);

	batch(() => {
		dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		dispatch(serverInitAdd(previousServer));
	});
}
