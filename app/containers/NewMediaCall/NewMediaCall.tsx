import { type ReactElement, useEffect } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { PeerList } from './PeerList';
import { SelectedPeer } from './SelectedPeer';
import { CreateCall } from './CreateCall';
import { FilterHeader } from './FilterHeader';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';

export const NewMediaCall = (): ReactElement => {
	const reset = usePeerAutocompleteStore(state => state.reset);
	useEffect(() => () => reset(), [reset]);

	return (
		<View style={styles.screen}>
			<FilterHeader />
			<SelectedPeer />
			<PeerList />
			<CreateCall />
		</View>
	);
};

const styles = StyleSheet.create((theme, rt) => ({
	screen: {
		paddingHorizontal: 16,
		paddingTop: 16,
		backgroundColor: theme.colors.surfaceLight,
		paddingBottom: rt.insets.bottom + 16
	}
}));
