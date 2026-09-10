import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSelector } from '../../lib/hooks/useAppSelector';
import openLink from '../../lib/methods/helpers/openLink';
import { closeConferenceCall } from '../../lib/services/conference/conferenceCallNavigation';
import { useConferenceCallStore } from '../../lib/services/conference/useConferenceCallStore';
import { useTheme } from '../../theme';
import ConferenceWebView from './ConferenceWebView';

const ConferenceCall = () => {
	const { callId, url, expanded } = useConferenceCallStore();
	const server = useAppSelector(state => state.server.server);
	const { theme } = useTheme();
	const { top, bottom } = useSafeAreaInsets();
	const callServer = useRef(server);

	// The overlay lives outside the navigator, so switching servers never unmounts it.
	useEffect(() => {
		if (callId && callServer.current !== server) {
			closeConferenceCall();
		}
		callServer.current = server;
	}, [server, callId]);

	const onOpenLink = useCallback(
		(path: string) => {
			if (!path.startsWith('/')) {
				return;
			}
			openLink(`${server.replace(/\/+$/, '')}${path}`, theme);
		},
		[server, theme]
	);

	if (!callId || !url) {
		return null;
	}

	return (
		<View
			style={[styles.host, { paddingTop: top, paddingBottom: bottom }, expanded ? styles.expanded : styles.offscreen]}
			pointerEvents={expanded ? 'auto' : 'none'}>
			<ConferenceWebView url={url} onClose={closeConferenceCall} onOpenLink={onOpenLink} />
		</View>
	);
};

const styles = StyleSheet.create({
	host: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgb(31,33,38)' },
	expanded: {},
	offscreen: { transform: [{ translateX: -100000 }] }
});

export default ConferenceCall;
