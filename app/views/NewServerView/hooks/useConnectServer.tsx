import { Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';

import sdk from '../../../lib/services/sdk';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { selectServerClear, serverRequest } from '../../../actions/server';
import completeUrl from '../utils/completeUrl';
import { ISubmitParams } from '../definitions';
import basicAuth from '../methods/basicAuth';

type TUseNewServerProps = {
	workspaceUrl: string;
	previousServer: string | null;
};

const useConnectServer = ({ workspaceUrl, previousServer }: TUseNewServerProps) => {
	const dispatch = useDispatch();

	const submit = ({ fromServerHistory = false, username, serverUrl }: ISubmitParams = {}) => {
		logEvent(events.NS_CONNECT_TO_WORKSPACE);

		// Clear the previous workspace to prevent being stuck on the previous server
		if (!previousServer) {
			sdk.disconnect();
			dispatch(selectServerClear());
		}
		if (workspaceUrl || serverUrl) {
			Keyboard.dismiss();
			const server = completeUrl(serverUrl ?? workspaceUrl);

			// Save info - HTTP Basic Authentication
			basicAuth(server, serverUrl ?? workspaceUrl);

			if (fromServerHistory) {
				dispatch(serverRequest(server, username, true));
			} else {
				dispatch(serverRequest(server));
			}
		}
	};

	return {
		submit
	};
};

export default useConnectServer;
