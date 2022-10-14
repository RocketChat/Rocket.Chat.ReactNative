import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { useTheme } from '../../../theme';

export default function VideoConferenceSkeletonLoading(): React.ReactElement {
	const { colors } = useTheme();

	return (
		<SkeletonPlaceholder backgroundColor={colors.conferenceCallBackground}>
			{/* Typo: I opened a PR to remove these empty styles https://github.com/chramos/react-native-skeleton-placeholder/pull/89 */}
			<SkeletonPlaceholder.Item style={{}} borderWidth={1} borderRadius={4} marginTop={8}>
				<SkeletonPlaceholder.Item style={{}} alignItems={'center'} flexDirection='row' marginTop={16} marginLeft={16}>
					<SkeletonPlaceholder.Item style={{}} width={28} height={28} />
					<SkeletonPlaceholder.Item style={{}} width={75} height={16} marginLeft={8} borderRadius={0} />
				</SkeletonPlaceholder.Item>
				<SkeletonPlaceholder.Item
					width={'100%'}
					height={48}
					marginTop={16}
					borderBottomLeftRadius={4}
					borderBottomRightRadius={4}
					borderTopLeftRadius={0}
					borderTopRightRadius={0}
					style={{}}
				/>
			</SkeletonPlaceholder.Item>
		</SkeletonPlaceholder>
	);
}
