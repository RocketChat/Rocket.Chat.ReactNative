import { memo, useEffect, useState } from 'react';
import { StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import Animated, { cancelAnimation, makeMutable, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

import { headers } from '~/lib/methods/helpers/fetch';
import { useTheme } from '~/theme';

interface IAvatarImage {
	uri?: string;
	style: ImageStyle;
}

const styles = StyleSheet.create({
	skeleton: {
		...StyleSheet.absoluteFill
	}
});

const SKELETON_DELAY = 150;

const pulse = makeMutable(1);
let activeSkeletons = 0;

const startPulse = () => {
	if (activeSkeletons++ === 0) {
		pulse.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
	}
};

const stopPulse = () => {
	if (--activeSkeletons === 0) {
		cancelAnimation(pulse);
		pulse.value = 1;
	}
};

const Skeleton = ({ borderRadius }: { borderRadius: ViewStyle['borderRadius'] }) => {
	const { colors } = useTheme();

	useEffect(() => {
		startPulse();
		return stopPulse;
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

	return (
		<Animated.View
			pointerEvents='none'
			testID='avatar-skeleton'
			style={[styles.skeleton, { backgroundColor: colors.surfaceSelected, borderRadius }, animatedStyle]}
		/>
	);
};

const AvatarImage = memo(({ uri, style }: IAvatarImage) => {
	const { colors } = useTheme();
	const [loadedUri, setLoadedUri] = useState<string | undefined>();
	const [delayedUri, setDelayedUri] = useState<string | undefined>();
	const showSkeleton = loadedUri !== uri && delayedUri === uri;

	useEffect(() => {
		const timer = setTimeout(() => setDelayedUri(uri), SKELETON_DELAY);
		return () => clearTimeout(timer);
	}, [uri]);

	const onEnd = () => setLoadedUri(uri);

	return (
		<View style={[style, { backgroundColor: colors.surfaceNeutral }]}>
			<Image
				style={style}
				source={{
					uri,
					headers: RocketChatSettings.customHeaders ?? headers
				}}
				priority='high'
				onLoad={onEnd}
				onError={onEnd}
			/>
			{showSkeleton ? <Skeleton borderRadius={style.borderRadius} /> : null}
		</View>
	);
});

export default AvatarImage;
