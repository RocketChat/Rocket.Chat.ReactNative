import { useRef, useState, type ReactElement } from 'react';
import { type LayoutChangeEvent, StyleSheet, type StyleProp, type ViewStyle, View } from 'react-native';
import {
	GestureDetector,
	usePanGesture,
	usePinchGesture,
	useSimultaneousGestures,
	useTapGesture
} from 'react-native-gesture-handler';
import Animated, { withTiming, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Image, type ImageStyle } from 'expo-image';

import Touch from '../Touch';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import { AUTOPLAY_GIFS_PREFERENCES_KEY } from '~/lib/constants/keys';
import { useTheme } from '~/theme';
import I18n from '~/i18n';

interface ImageViewerProps {
	style?: StyleProp<ImageStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	imageContainerStyle?: StyleProp<ViewStyle>;

	uri: string;
	width: number;
	height: number;
	onLoadEnd?: () => void;
	altText?: string;
	isAnimated?: boolean;
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	flex: {
		width: '100%',
		height: '100%'
	},
	image: {
		width: '100%',
		height: '100%'
	}
});

export const ImageViewer = ({ uri = '', width, height, altText, isAnimated, ...props }: ImageViewerProps): ReactElement => {
	const [autoplayGifs] = useUserPreferences<boolean>(AUTOPLAY_GIFS_PREFERENCES_KEY, true);
	const [isPlaying, setIsPlaying] = useState<boolean>(!!autoplayGifs);
	const expoImageRef = useRef<Image>(null);

	const handleGifPlayback = async () => {
		if (isPlaying) {
			setIsPlaying(false);
			await expoImageRef.current?.stopAnimating();
			return;
		}
		setIsPlaying(true);
		await expoImageRef.current?.startAnimating();
	};
	const [centerX, setCenterX] = useState(0);
	const [centerY, setCenterY] = useState(0);

	const onLayout = ({
		nativeEvent: {
			layout: { x, y, width, height }
		}
	}: LayoutChangeEvent) => {
		setCenterX(x + width / 2);
		setCenterY(y + height / 2);
	};

	const translationX = useSharedValue<number>(0);
	const translationY = useSharedValue<number>(0);
	const offsetX = useSharedValue<number>(0);
	const offsetY = useSharedValue<number>(0);
	const scale = useSharedValue<number>(1);
	const scaleOffset = useSharedValue<number>(1);

	const style = useAnimatedStyle(() => ({
		transform: [{ translateX: translationX.value }, { translateY: translationY.value }, { scale: scale.value }]
	}));

	const resetScaleAnimation = () => {
		'worklet';

		scaleOffset.set(1);
		offsetX.set(0);
		offsetY.set(0);
		scale.set(withSpring(1));
		translationX.set(withSpring(0, { overshootClamping: true }));
		translationY.set(withSpring(0, { overshootClamping: true }));
	};

	const clamp = (value: number, min: number, max: number) => {
		'worklet';

		return Math.max(Math.min(value, max), min);
	};

	const pinchGesture = usePinchGesture({
		onUpdate: event => {
			scale.set(clamp(scaleOffset.get() * (event.scale > 0 ? event.scale : 1), 1, 4));
		},
		onDeactivate: () => {
			scaleOffset.set(scale.get() > 0 ? scale.get() : 1);
		}
	});

	const panGesture = usePanGesture({
		maxPointers: 2,
		onActivate: () => {
			translationX.set(offsetX.get());
			translationY.set(offsetY.get());
		},
		onUpdate: event => {
			const scaleFactor = scale.get() - 1;
			translationX.set(clamp(event.translationX + offsetX.get(), -scaleFactor * centerX, scaleFactor * centerX));
			translationY.set(clamp(event.translationY + offsetY.get(), -scaleFactor * centerY, scaleFactor * centerY));
		},
		onDeactivate: () => {
			offsetX.set(translationX.get());
			offsetY.set(translationY.get());
			if (scale.get() === 1) resetScaleAnimation();
		}
	});

	const doubleTapGesture = useTapGesture({
		numberOfTaps: 2,
		maxDelay: 120,
		maxDistance: 70,
		onDeactivate: event => {
			if (scaleOffset.get() > 1) resetScaleAnimation();
			else {
				scale.set(withTiming(2, { duration: 200 }));
				translationX.set(withTiming(centerX - event.x, { duration: 200 }));
				offsetX.set(centerX - event.x);
				scaleOffset.set(2);
			}
		}
	});

	const gesture = useSimultaneousGestures(pinchGesture, panGesture, doubleTapGesture);

	const { colors } = useTheme();

	const accessibilityLabel = altText?.trim() || I18n.t('A11y_image_no_description');

	return (
		<View importantForAccessibility='no' style={[styles.container, { width, height, backgroundColor: colors.surfaceNeutral }]}>
			<GestureDetector gesture={gesture}>
				<Animated.View accessible={false} onLayout={onLayout} style={[styles.flex, style]}>
					{isAnimated ? (
						<Touch
							accessible
							accessibilityLabel={accessibilityLabel}
							accessibilityRole='button'
							accessibilityHint={I18n.t('A11y_image_viewer_gif_hint')}
							onPress={handleGifPlayback}
							style={styles.flex}
							rectButtonStyle={styles.flex}>
							<Image
								accessible={false}
								style={styles.image}
								contentFit='contain'
								source={{ uri }}
								ref={expoImageRef}
								{...props}
							/>
						</Touch>
					) : (
						<Image
							accessible
							accessibilityLabel={accessibilityLabel}
							accessibilityRole='image'
							style={styles.image}
							contentFit='contain'
							source={{ uri }}
							ref={expoImageRef}
							{...props}
						/>
					)}
				</Animated.View>
			</GestureDetector>
		</View>
	);
};
