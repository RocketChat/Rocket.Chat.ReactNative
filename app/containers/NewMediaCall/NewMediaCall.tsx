import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PeerList } from './PeerList';
import { SelectedPeer } from './SelectedPeer';
import { CreateCall } from './CreateCall';
import { FilterHeader } from './FilterHeader';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { useTheme } from '../../theme';

export const NewMediaCall = (): React.ReactElement => {
	const { colors } = useTheme();
	const reset = usePeerAutocompleteStore(state => state.reset);
	const { bottom } = useSafeAreaInsets();
	useEffect(() => () => reset(), [reset]);

	return (
		<View style={[styles.screen, { backgroundColor: colors.surfaceLight, paddingBottom: bottom + 16 }]}>
			<View style={styles.content}>
				<FilterHeader />
				<SelectedPeer />
				<PeerList />
			</View>
			<CreateCall />
		</View>
	);
};

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 16
	},
	content: {
		flex: 1
	}
});
