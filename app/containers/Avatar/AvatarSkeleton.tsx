import { useEffect, useState } from 'react';
import { type ImageStyle, StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { useTheme } from '~/theme';

interface IAvatarSkeleton {
	style: ImageStyle;
}

const SKELETON_DELAY = 150;

const AvatarSkeleton = ({ style }: IAvatarSkeleton) => {
	const { colors } = useTheme();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setVisible(true), SKELETON_DELAY);
		return () => clearTimeout(timer);
	}, []);

	if (!visible) {
		return null;
	}

	return (
		<View pointerEvents='none' testID='avatar-skeleton' style={StyleSheet.absoluteFill}>
			<SkeletonPlaceholder backgroundColor={colors.surfaceNeutral} highlightColor={colors.surfaceSelected}>
				<SkeletonPlaceholder.Item width={style.width} height={style.height} borderRadius={style.borderRadius} />
			</SkeletonPlaceholder>
		</View>
	);
};

export default AvatarSkeleton;
