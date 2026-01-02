/* eslint-disable react-hooks/immutability */
import React, { forwardRef, useContext } from 'react';
import {
	Pressable,
	type PressableProps,
	type GestureResponderEvent,
	type PressableAndroidRippleConfig,
	StyleSheet,
	type ViewStyle
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { View } from 'react-native-animatable';

import { isAndroid } from '../lib/methods/helpers';
import { useTheme } from '../theme';
import MessageContext from './message/Context';

export interface IPressableOpacityProps extends PressableProps {
	opacityAnimationConfig?: {
		fadeInDuration?: number;
		fadeOutDuration?: number;
		dimOpacity?: number;
	};
	disableOpacityOnAndroid?: boolean;
	disableAndroidRipple?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FADE_IN_DURATION = 50;
const FADE_OUT_DURATION = 100;
const DIM_OPACITY = 0.3;

const PressableOpacity = forwardRef<React.ComponentRef<typeof Pressable>, IPressableOpacityProps>(
	(
		{
			children,
			style,
			onPressIn,
			onPressOut,
			android_ripple,
			disableAndroidRipple,
			disableOpacityOnAndroid,
			opacityAnimationConfig,
			onLongPress: onLongPressPropEvent,
			...restProps
		},
		ref
	) => {
		const { colors } = useTheme();
		const messageContext = useContext(MessageContext);
		const onLongPressFromContext = messageContext?.onLongPress;
		const opacity = useSharedValue(1);

		const rStyle = useAnimatedStyle(() => ({
			opacity: opacity.value
		}));

		const androidRippleResolvedColor = android_ripple?.color ?? colors.buttonBackgroundSecondaryPress;

		const androidRippleConfig: PressableAndroidRippleConfig = {
			...android_ripple,
			color: androidRippleResolvedColor
		};

		// without this layout style mapping on container the ripple overflows
		const { containerStyle } = getProcessedStyles(style);
		const pressableStyles = getCleanedStyles({ containerStyle });

		const {
			fadeInDuration = FADE_IN_DURATION,
			fadeOutDuration = FADE_OUT_DURATION,
			dimOpacity = DIM_OPACITY
		} = opacityAnimationConfig ?? {};

		const handlePressIn = (e: GestureResponderEvent) => {
			opacity.value = withTiming(dimOpacity, { duration: fadeInDuration });
			onPressIn?.(e);
		};

		const handlePressOut = (e: GestureResponderEvent) => {
			opacity.value = withTiming(1, { duration: fadeOutDuration });
			onPressOut?.(e);
		};

		// for message component to open modal after long press
		const handleLongPress = (e: GestureResponderEvent) => {
			onLongPressPropEvent?.(e);
			onLongPressFromContext?.(e);
		};

		const shouldBlockOpacityAnimationOnAndroid = isAndroid && disableOpacityOnAndroid;

		return (
			// required as android_ripple does not clips the ripple according to borderradius
			<View style={containerStyle}>
				<AnimatedPressable
					ref={ref}
					style={[style, pressableStyles, rStyle]}
					onPressIn={!shouldBlockOpacityAnimationOnAndroid ? handlePressIn : null}
					onPressOut={!shouldBlockOpacityAnimationOnAndroid ? handlePressOut : null}
					onLongPress={handleLongPress}
					android_ripple={!disableAndroidRipple ? androidRippleConfig : null}
					{...restProps}>
					{children}
				</AnimatedPressable>
			</View>
		);
	}
);

PressableOpacity.displayName = 'PressableOpacity';

const extractStyles = (style: PressableProps['style']) => {
	if (typeof style === 'function') {
		return undefined; // cannot extract
	}
	const flat = StyleSheet.flatten(style);
	return flat;
};

interface IGetProccessedStylesReturnType {
	containerStyle: ViewStyle | undefined;
	flattenedStyle: ViewStyle | undefined;
}

const getProcessedStyles = (style: PressableProps['style']): IGetProccessedStylesReturnType => {
	const flattenedStyle = extractStyles(style);

	if (!flattenedStyle) return { containerStyle: undefined, flattenedStyle: undefined };
	const containerStyle: ViewStyle = {
		borderEndEndRadius: flattenedStyle.borderEndEndRadius,
		borderTopEndRadius: flattenedStyle.borderTopEndRadius,
		borderTopLeftRadius: flattenedStyle.borderTopLeftRadius,
		borderEndStartRadius: flattenedStyle.borderEndStartRadius,
		borderStartEndRadius: flattenedStyle.borderStartEndRadius,
		borderTopRightRadius: flattenedStyle.borderTopRightRadius,
		borderTopStartRadius: flattenedStyle.borderTopStartRadius,
		borderBottomEndRadius: flattenedStyle.borderBottomEndRadius,
		borderBottomLeftRadius: flattenedStyle.borderBottomLeftRadius,
		borderStartStartRadius: flattenedStyle.borderStartStartRadius,
		borderBottomRightRadius: flattenedStyle.borderBottomRightRadius,
		borderBottomStartRadius: flattenedStyle.borderBottomStartRadius,
		// width: flattenedStyle.width,
		// height: flattenedStyle.height,
		margin: flattenedStyle.margin,
		marginLeft: flattenedStyle.marginLeft,
		marginRight: flattenedStyle.marginRight,
		marginBottom: flattenedStyle.marginBottom,
		marginTop: flattenedStyle.marginTop,
		borderRadius: flattenedStyle.borderRadius,
		flex: flattenedStyle.flex,
		position: flattenedStyle.position,
		top: flattenedStyle.top,
		bottom: flattenedStyle.bottom,
		left: flattenedStyle.left,
		right: flattenedStyle.right,
		overflow: flattenedStyle.overflow ?? 'hidden'
	};

	return { containerStyle, flattenedStyle };
};

interface IRemoveStylesParams {
	containerStyle: ViewStyle | undefined;
}

// this removes margin and other layout styles from getting applied on the pressable
const getCleanedStyles = ({ containerStyle }: IRemoveStylesParams): ViewStyle | undefined => {
	if (!containerStyle) return undefined;

	const cleanedStyles = {} as Partial<ViewStyle>;
	for (const key of Object.keys(containerStyle)) {
		const value = containerStyle[key as keyof ViewStyle];
		if (value !== undefined && value !== null) {
			// overflow isnt numeric so we skip it
			if (key === 'overflow' || key === 'flex') continue;
			if (key === 'position') {
				cleanedStyles.position = 'relative';
				continue;
			}
			(cleanedStyles as any)[key] = 0;
		}
	}
	return cleanedStyles as ViewStyle;
};

export default PressableOpacity;
