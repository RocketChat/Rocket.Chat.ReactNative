import { useFocusEffect } from '@react-navigation/native';
import { useCallback, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Navigation from '../lib/navigation/appNavigation';
import { useConferenceCallStore } from '../lib/services/conference/useConferenceCallStore';

const ConferenceView = (): ReactElement => {
	const expand = useConferenceCallStore(state => state.expand);
	const minimize = useConferenceCallStore(state => state.minimize);

	useFocusEffect(
		useCallback(() => {
			if (!useConferenceCallStore.getState().callId) {
				if (Navigation.getCurrentRoute()?.name === 'ConferenceView') {
					Navigation.back();
				}
				return;
			}

			expand();
			return () => minimize();
		}, [expand, minimize])
	);

	return <View style={styles.container} />;
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: 'rgb(31,33,38)' }
});

export default ConferenceView;
