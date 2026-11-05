import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { SKELETON_DELAY } from './constants';

interface IAvatarSkeleton {
	size: number;
	borderRadius: number;
	backgroundColor: string;
	highlightColor: string;
}

const AvatarSkeleton = ({ size, borderRadius, backgroundColor, highlightColor }: IAvatarSkeleton) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setVisible(true), SKELETON_DELAY);
		return () => clearTimeout(timer);
	}, []);

	if (!visible) {
		return null;
	}

	return (
		<View pointerEvents='none' style={StyleSheet.absoluteFill}>
			<SkeletonPlaceholder backgroundColor={backgroundColor} highlightColor={highlightColor}>
				<SkeletonPlaceholder.Item width={size} height={size} borderRadius={borderRadius} />
			</SkeletonPlaceholder>
		</View>
	);
};

export default AvatarSkeleton;
