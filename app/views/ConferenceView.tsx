import { useFocusEffect } from '@react-navigation/native';
import { useCallback, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import I18n from '~/i18n';
import ConferenceEndedMessage from '~/containers/ConferenceCall/ConferenceEndedMessage';
import ConferenceMessage from '~/containers/ConferenceCall/ConferenceMessage';
import ConferencePreflight from '~/containers/ConferenceCall/ConferencePreflight';
import LazyConferenceInCall from '~/containers/ConferenceCall/LazyConferenceInCall';
import { hideActionSheetRef } from '~/containers/ActionSheet';
import StatusBar from '~/containers/StatusBar';
import { hasNativeHeaderBar } from '../lib/methods/helpers/deviceInfo';
import Navigation from '../lib/navigation/appNavigation';
import { CONFERENCE_ROUTE, closeConferenceCall } from '../lib/services/conference/conferenceCallNavigation';
import {
	isInConferenceCall,
	type TConferenceError,
	useConferenceCallStore
} from '../lib/services/conference/useConferenceCallStore';
import { useTheme } from '../theme';

const ERROR_KEYS: Record<TConferenceError, string> = {
	'not-licensed': 'Conference_error_not_licensed',
	'not-configured': 'Conference_error_not_configured',
	'token-failed': 'Conference_error_token_failed',
	'join-failed': 'error-init-video-conf',
	unsupported: 'Conference_error_unsupported',
	ended: 'Call_ended'
};

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

const ConferenceView = (): ReactElement => {
	const { colors } = useTheme();
	const { top, bottom } = useSafeAreaInsets();
	const phase = useConferenceCallStore(state => state.phase);
	const error = useConferenceCallStore(state => state.error);
	const expand = useConferenceCallStore(state => state.expand);
	const minimize = useConferenceCallStore(state => state.minimize);
	const setPhase = useConferenceCallStore(state => state.setPhase);

	useFocusEffect(
		useCallback(() => {
			if (!useConferenceCallStore.getState().callId) {
				if (Navigation.getCurrentRoute()?.name === CONFERENCE_ROUTE) {
					Navigation.back();
				}
				return;
			}

			expand();
			return () => {
				hideActionSheetRef();
				minimize();
				if (!isInConferenceCall() && useConferenceCallStore.getState().callId) {
					closeConferenceCall();
				}
			};
		}, [expand, minimize])
	);

	const renderContent = () => {
		switch (phase) {
			case 'preflight':
			case 'joining':
			case 'connecting':
				return <ConferencePreflight />;
			case 'connected':
			case 'reconnecting':
				return <LazyConferenceInCall />;
			case 'ended':
				return <ConferenceEndedMessage onRejoin={() => setPhase('preflight')} />;
			default:
				return (
					<ConferenceMessage
						icon='warning'
						title={I18n.t(ERROR_KEYS[error ?? 'join-failed'])}
						actions={[
							{ title: I18n.t('Try_again'), onPress: () => setPhase('preflight'), testID: 'conference-error-retry' },
							{ title: I18n.t('Close'), type: 'secondary', onPress: closeConferenceCall, testID: 'conference-error-close' }
						]}
					/>
				);
		}
	};

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: hasNativeHeaderBar ? top : 0, paddingBottom: bottom, backgroundColor: colors.surfaceRoom }
			]}>
			<StatusBar />
			{renderContent()}
		</View>
	);
};

export default ConferenceView;
