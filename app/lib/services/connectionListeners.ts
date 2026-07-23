import { store } from '../store/auxStore';
import { connectSuccess, disconnect as disconnectAction } from '../../actions/connect';
import { loginRequest } from '../../actions/login';

/**
 * Builds the `'connected'` stream listener that `connect()` registers on the current SDK instance.
 * A `'connected'` DDP event only follows a real handshake on a (re)opened socket, whose server-side
 * subscriptions are empty, so recovery must always run: `connectSuccess` is idempotent and the resume
 * `loginRequest` is deduped by `takeLatest`. Extracted so the connection-lifecycle regression suite
 * binds this REAL dispatch logic instead of a drifting replica.
 */
export function createConnectedListener(logoutOnError: boolean) {
	return () => {
		store.dispatch(connectSuccess());
		const { user } = store.getState().login;
		if (user?.token) {
			store.dispatch(loginRequest({ resume: user.token }, logoutOnError));
		}
	};
}

/**
 * Builds the `'close'` stream listener that `connect()` registers on the current SDK instance.
 * `onClose` is injected so this module stays free of the VoIP dependency tree: `connect()` passes an
 * `onClose` that arms its closure-local pendingHangups drain flag, while the regression suite passes a
 * test double. The guard/dispatch logic itself is exercised as REAL code.
 */
export function createCloseListener({ onClose }: { onClose?: () => void }) {
	return () => {
		onClose?.();
		store.dispatch(disconnectAction());
	};
}
