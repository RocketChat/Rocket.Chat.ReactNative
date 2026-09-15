import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { normalizeServer } from '~/lib/methods/helpers/isConferenceUrl';
import openLink from '~/lib/methods/helpers/openLink';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { useTheme } from '~/theme';
import StatusBar from '../StatusBar';
import ConferenceWebView from './ConferenceWebView';

const ConferenceCall = () => {
	const { callId, url, expanded, server: owner } = useConferenceCallStore();
	const server = useAppSelector(state => state.server.server);
	const { theme } = useTheme();
	const { top, bottom } = useSafeAreaInsets();
	const callServer = useRef(server);

	useEffect(() => {
		if (callId && (owner ?? callServer.current) !== server) {
			closeConferenceCall();
		}
		callServer.current = server;
	}, [server, callId, owner]);

	const onOpenLink = useCallback(
		(path: string) => {
			if (!path.startsWith('/')) {
				return;
			}
			openLink(`${normalizeServer(server)}${path}`, theme);
		},
		[server, theme]
	);

	if (!callId || !url) {
		return null;
	}

	return (
		<View
			style={[styles.host, { paddingTop: top, paddingBottom: bottom }, !expanded && styles.offscreen]}
			pointerEvents={expanded ? 'auto' : 'none'}>
			{expanded ? <StatusBar barStyle='light' /> : null}
			<ConferenceWebView url={url} expanded={expanded} onClose={closeConferenceCall} onOpenLink={onOpenLink} />
		</View>
	);
};

const styles = StyleSheet.create({
	host: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		backgroundColor: 'rgb(31,33,38)'
	},
	offscreen: {
		transform: [{ translateX: -100000 }]
	}
});

export default ConferenceCall;
