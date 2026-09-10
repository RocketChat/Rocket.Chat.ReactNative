import { useFocusEffect } from '@react-navigation/native';
import { useCallback, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Navigation from '../lib/navigation/appNavigation';
import { useConferenceCallStore } from '../lib/services/conference/useConferenceCallStore';

const ConferenceView = (): ReactElement => {
	const { expand, minimize } = useConferenceCallStore();

	useFocusEffect(
		useCallback(() => {
			if (!useConferenceCallStore.getState().callId) {
				Navigation.back();
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
