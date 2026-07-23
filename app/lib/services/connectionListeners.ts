import { store } from '../store/auxStore';
import { connectSuccess, disconnect as disconnectAction } from '../../actions/connect';
import { loginRequest } from '../../actions/login';

/**
 * Builds the `'connected'` stream listener that `connect()` registers on the current SDK instance.
 * The `meteor.connected` guard short-circuits recovery when redux already reads connected — the
 * ordering under investigation by the connection-recovery effort. Extracted (with zero behavior
 * change) so the connection-lifecycle regression suite binds this REAL guard/dispatch logic instead
 * of a drifting replica.
 */
export function createConnectedListener(logoutOnError: boolean) {
	return () => {
		const { connected } = store.getState().meteor;
		if (connected) {
			return;
		}
		store.dispatch(connectSuccess());
		const { user } = store.getState().login;
		if (user?.token) {
			store.dispatch(loginRequest({ resume: user.token }, logoutOnError));
		}
	};
}

/**
 * Builds the `'close'` stream listener that `connect()` registers on the current SDK instance.
 * `unsubscribeRooms` and `onClose` are injected so this module stays free of the rooms-subscription
 * and VoIP dependency trees: `connect()` passes the real `unsubscribeRooms` and an `onClose` that
 * arms its closure-local pendingHangups drain flag, while the regression suite passes test doubles
 * for those out-of-scope concerns. The guard/dispatch logic itself is exercised as REAL code.
 */
export function createCloseListener({ unsubscribeRooms, onClose }: { unsubscribeRooms: () => void; onClose?: () => void }) {
	return () => {
		unsubscribeRooms();
		onClose?.();
		store.dispatch(disconnectAction());
	};
}
