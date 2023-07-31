import React, { useContext } from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { View } from 'react-native';

import { useTheme } from '../../../../theme';
import { MessageComposerContext } from '../../context';

export const AutocompleteItemLoading = (): React.ReactElement => {
	const { colors } = useTheme();
	const { autocompleteType } = useContext(MessageComposerContext);
	if (autocompleteType === '/preview') {
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
