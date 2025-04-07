import { useCallback } from 'react';
import { batch, useDispatch } from 'react-redux';

import { selectServerRequest, serverInitAdd } from '../../actions/server';
import { appStart } from '../../actions/app';
import I18n from '../../i18n';
import EventEmitter from '../../lib/methods/helpers/events';
import { TOKEN_KEY } from '../../lib/constants';
import { localAuthenticate } from '../../lib/methods/helpers/localAuthentication';
import { showConfirmationAlert } from '../../lib/methods/helpers/info';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import UserPreferences from '../../lib/methods/userPreferences';
import { RootEnum } from '../../definitions';
import { removeServer } from '../../lib/methods';
import { useAppSelector } from '../../lib/hooks';

function useNavigateToNewServer() {
	const dispatch = useDispatch();
	return useCallback(
		(previousServer: string) => {
			batch(() => {
				dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
				dispatch(serverInitAdd(previousServer));
			});
		},
		[dispatch]
	);
}
export function useAddServer(close: () => void, server: string) {
	const navToNewServer = useNavigateToNewServer();
	return useCallback(() => {
		logEvent(events.RL_ADD_SERVER);
		close();
		navToNewServer(server);
	}, [close, navToNewServer, server]);
}
export function useSelectServer(close: () => void, server: string) {
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navToNewServer = useNavigateToNewServer();
	const dispatch = useDispatch();
	return useCallback(
		async (serverParam: string, version: string) => {
			close();
			if (server !== serverParam) {
				logEvent(events.RL_CHANGE_SERVER);
				const userId = UserPreferences.getString(`${TOKEN_KEY}-${serverParam}`);
				if (isMasterDetail) {
					goRoom({ item: {}, isMasterDetail });
				}
				if (!userId) {
					navToNewServer(server);
					// Intentionally not cleared, because it needs to trigger the emitter even after unmount
					setTimeout(() => {
						EventEmitter.emit('NewServer', { server: serverParam });
					}, 300);
				} else {
					await localAuthenticate(serverParam);
					dispatch(selectServerRequest(serverParam, version, true, true));
				}
			}
		},
		[close, dispatch, navToNewServer, isMasterDetail, server]
	);
}
export function useRemoveServer(close: () => void) {
	return useCallback(
		(server: string) =>
			showConfirmationAlert({
				message: I18n.t('This_will_remove_all_data_from_this_server'),
				confirmationText: I18n.t('Delete'),
				onPress: async () => {
					close();
					try {
						await removeServer({ server });
					} catch {
						// do nothing
					}
				}
			}),
		[close]
	);
}
