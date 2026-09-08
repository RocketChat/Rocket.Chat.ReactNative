import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSelector } from '../../lib/hooks/useAppSelector';
import openLink from '../../lib/methods/helpers/openLink';
import Navigation from '../../lib/navigation/appNavigation';
import { useConferenceCallStore } from '../../lib/services/conference/useConferenceCallStore';
import ConferenceWebView from './ConferenceWebView';
import MinimizedCallBar from './MinimizedCallBar';

const CONFERENCE_ROUTE = 'ConferenceView';

const ConferenceCall = () => {
	const { callId, url, expanded, expand, close } = useConferenceCallStore();
	const server = useAppSelector(state => state.server.server);
	const { top, bottom } = useSafeAreaInsets();

	const onOpenLink = useCallback(
		(path: string) => {
			if (!path.startsWith('/')) {
				return;
			}
			openLink(`${server.replace(/\/+$/, '')}${path}`);
		},
		[server]
	);

	const onClose = useCallback(() => {
		close();
		if (Navigation.getCurrentRoute()?.name === CONFERENCE_ROUTE) {
			Navigation.back();
		}
	}, [close]);

	const onExpand = useCallback(() => {
		expand();
		Navigation.navigate('ConferenceView');
	}, [expand]);

	if (!callId || !url) {
		return null;
	}

	return (
		<>
			<View
				style={[styles.host, { paddingTop: top, paddingBottom: bottom }, expanded ? styles.expanded : styles.offscreen]}
				pointerEvents={expanded ? 'auto' : 'none'}>
				<ConferenceWebView url={url} onClose={onClose} onOpenLink={onOpenLink} />
			</View>
			{expanded ? null : <MinimizedCallBar onPress={onExpand} />}
		</>
	);
};

const styles = StyleSheet.create({
	host: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgb(31,33,38)' },
	expanded: {},
	offscreen: { transform: [{ translateX: -100000 }] }
});

export default ConferenceCall;
