import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { useTheme } from '../../../../theme';

export default function VideoConferenceSkeletonLoading(): React.ReactElement {
	const { colors } = useTheme();

	return (
		<SkeletonPlaceholder backgroundColor={colors.surfaceTint}>
			<SkeletonPlaceholder.Item borderWidth={1} borderColor={colors.surfaceHover} borderRadius={4} marginTop={8}>
				<SkeletonPlaceholder.Item alignItems={'center'} flexDirection='row' marginTop={16} marginLeft={16}>
					<SkeletonPlaceholder.Item width={28} height={26} />
					<SkeletonPlaceholder.Item width={75} height={16} marginLeft={8} borderRadius={0} />
				</SkeletonPlaceholder.Item>
				<SkeletonPlaceholder.Item
					width={'100%'}
					height={48}
					marginTop={16}
					borderBottomLeftRadius={4}
					borderBottomRightRadius={4}
					borderTopLeftRadius={0}
					borderTopRightRadius={0}
				/>
			</SkeletonPlaceholder.Item>
		</SkeletonPlaceholder>
	);
}
