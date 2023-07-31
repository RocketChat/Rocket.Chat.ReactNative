import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { View } from 'react-native';

import { useTheme } from '../../../../theme';

export const AutocompleteItemLoading = ({ preview = false }: { preview?: boolean }): React.ReactElement => {
	const { colors } = useTheme();
	if (preview) {
		return (
			<View style={{ flex: 1 }}>
				<SkeletonPlaceholder borderRadius={4} backgroundColor={colors.surfaceNeutral}>
					<SkeletonPlaceholder.Item height={80} width={80} />
				</SkeletonPlaceholder>
			</View>
		);
	}
	return (
		<View style={{ flex: 1 }}>
			<SkeletonPlaceholder borderRadius={4} backgroundColor={colors.surfaceNeutral}>
				<SkeletonPlaceholder.Item height={20} />
			</SkeletonPlaceholder>
		</View>
	);
};
