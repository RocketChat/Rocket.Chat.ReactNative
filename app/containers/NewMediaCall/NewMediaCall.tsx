import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { PeerList } from './PeerList';
import { SelectedPeer } from './SelectedPeer';
import { CreateCall } from './CreateCall';
import { FilterHeader } from './FilterHeader';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { useTheme } from '../../theme';

export const NewMediaCall = (): React.ReactElement => {
	const { colors } = useTheme();
	const reset = usePeerAutocompleteStore(state => state.reset);
	useEffect(() => () => reset(), [reset]);

	return (
		<View style={[styles.screen, { backgroundColor: colors.surfaceLight }]}>
			<FilterHeader />
			<SelectedPeer />
			<PeerList />
			<CreateCall />
		</View>
	);
};

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 16
	}
});
