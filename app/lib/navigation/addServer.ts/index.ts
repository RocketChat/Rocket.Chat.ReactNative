import { batch } from 'react-redux';

import { appStart } from '../../../actions/app';
import { serverInitAdd } from '../../../actions/server';
import { RootEnum } from '../../../definitions';
import store from '../../store';
import { logEvent, events } from '../../methods/helpers/log';

export function navigateToAddServer(previousServer: string) {
	logEvent(events.RL_ADD_SERVER);

	batch(() => {
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		store.dispatch(serverInitAdd(previousServer));
	});
}
