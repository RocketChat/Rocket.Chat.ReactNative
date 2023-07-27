import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { View } from 'react-native';

import { useTheme } from '../../../../theme';

export const AutocompleteItemLoading = (): React.ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={{ flex: 1 }}>
			<SkeletonPlaceholder borderRadius={4} backgroundColor={colors.surfaceNeutral}>
				<SkeletonPlaceholder.Item height={20} />
			</SkeletonPlaceholder>
		</View>
	);
};
