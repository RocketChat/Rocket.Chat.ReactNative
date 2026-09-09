import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import openLink from '../../lib/methods/helpers/openLink';
import { closeConferenceCall, minimizeConferenceCall } from '../../lib/services/conference/conferenceCallNavigation';
import { useConferenceCallStore } from '../../lib/services/conference/useConferenceCallStore';
import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import ConferenceWebView from './ConferenceWebView';

const ConferenceCall = () => {
	const { callId, url, expanded, close } = useConferenceCallStore();
	const server = useAppSelector(state => state.server.server);
	const { theme, colors } = useTheme();
	const { top, bottom } = useSafeAreaInsets();
	const callServer = useRef(server);

	// The overlay lives outside the navigator, so switching servers never unmounts it.
	useEffect(() => {
		if (callId && callServer.current !== server) {
			close();
		}
		callServer.current = server;
	}, [server, callId, close]);

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
			{/* Expanded, the webview covers the call header, so it carries its own way back. */}
			<TouchableOpacity
				style={[styles.minimize, { backgroundColor: colors.surfaceNeutral }]}
				onPress={minimizeConferenceCall}
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				accessibilityRole='button'
				accessibilityLabel={i18n.t('Minimize_call')}>
				<CustomIcon name='arrow-collapse' size={20} color={colors.fontDefault} />
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	host: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgb(31,33,38)' },
	expanded: {},
	offscreen: { transform: [{ translateX: -100000 }] },
	minimize: {
		position: 'absolute',
		left: 12,
		top: 12,
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export default ConferenceCall;
