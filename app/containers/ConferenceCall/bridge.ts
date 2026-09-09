const SOURCE = 'rc-conference';

const SESSION_HORIZON_MS = 24 * 60 * 60 * 1000;

export type TConferenceBridgeMessage = { type: 'close' } | { type: 'openInMainWindow'; path: string };

type TConferenceCredentials = { userId: string; token: string; server: string };

export const buildConferenceBridgeScript = ({ userId, token, server }: TConferenceCredentials): string => {
	const uid = JSON.stringify(userId);
	const loginToken = JSON.stringify(token);
	const serverUrl = JSON.stringify(server);
	const expires = JSON.stringify(new Date(Date.now() + SESSION_HORIZON_MS).toISOString());
	const source = JSON.stringify(SOURCE);

	return `(function () {
	try {
		window.localStorage.setItem('Meteor.userId', ${uid});
		window.localStorage.setItem('Meteor.loginToken', ${loginToken});
		window.localStorage.setItem('Meteor.loginTokenExpires', ${expires});
	} catch (e) {
		// Keep this script ES5: an optional catch binding is a SyntaxError on older Android
		// WebViews, which would drop the whole bridge.
	}

	var post = function (message) {
		if (window.ReactNativeWebView) {
			window.ReactNativeWebView.postMessage(JSON.stringify(message));
		}
	};

	window.videoCallWindow = {
		close: function () {
			post({ source: ${source}, type: 'close' });
		},
		openInMainWindow: function (path) {
			post({ source: ${source}, type: 'openInMainWindow', path: path });
		},
		requestScreenSharing: function () {
			return Promise.resolve(null);
		},
		getAuthCredentials: function () {
			return Promise.resolve({ userId: ${uid}, authToken: ${loginToken}, serverUrl: ${serverUrl} });
		}
	};
})();
true;`;
};

export const parseConferenceBridgeMessage = (raw: string): TConferenceBridgeMessage | undefined => {
	let message: unknown;

	try {
		message = JSON.parse(raw);
	} catch {
		return undefined;
	}

	if (typeof message !== 'object' || message === null) {
		return undefined;
	}

	const { source, type, path } = message as { source?: unknown; type?: unknown; path?: unknown };

	if (source !== SOURCE) {
		return undefined;
	}

	if (type === 'close') {
		return { type: 'close' };
	}

	if (type === 'openInMainWindow' && typeof path === 'string') {
		return { type: 'openInMainWindow', path };
	}

	return undefined;
};
