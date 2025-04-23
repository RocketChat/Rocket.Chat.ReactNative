import { Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';

import sdk from '../../../lib/services/sdk';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import UserPreferences from '../../../lib/methods/userPreferences';
import { CERTIFICATE_KEY } from '../../../lib/constants';
import { selectServerClear, serverRequest } from '../../../actions/server';
import completeUrl from '../utils/completeUrl';
import { ISubmitParams } from '../definitions';
import basicAuth from '../methods/basicAuth';

type TUseNewServerProps = {
	text: string;
	certificate: string | null;
	previousServer: string | null;
};

const useConnectServer = ({ text, certificate, previousServer }: TUseNewServerProps) => {
	const dispatch = useDispatch();

	const submit = ({ fromServerHistory = false, username, serverUrl }: ISubmitParams = {}) => {
		logEvent(events.NS_CONNECT_TO_WORKSPACE);

		// Clear the previous workspace to prevent being stuck on the previous server
		if (!previousServer) {
			sdk.disconnect();
			dispatch(selectServerClear());
		}
		if (text || serverUrl) {
			Keyboard.dismiss();
			const server = completeUrl(serverUrl ?? text);

			// Save info - SSL Pinning
			if (certificate) {
				UserPreferences.setString(`${CERTIFICATE_KEY}-${server}`, certificate);
			}

			// Save info - HTTP Basic Authentication
			basicAuth(server, serverUrl ?? text);

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
