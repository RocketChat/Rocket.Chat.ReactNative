import { useEffect } from 'react';
import {
	type EntryExitAnimationFunction,
	type ILayoutAnimationBuilder,
	type LayoutAnimationsValues,
	ReduceMotion,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
	type WithSpringConfig
} from 'react-native-reanimated';

import { useSectionReveal } from './useSectionReveal';

const SPRING_STIFFNESS = 520;
const SPRING_DAMPING = 45.6;
const SPRING_MASS = 1;
const SECTION_SPRING = {
	stiffness: SPRING_STIFFNESS,
	damping: SPRING_DAMPING,
	mass: SPRING_MASS,
	reduceMotion: ReduceMotion.System
};
const BADGE_IN_SPRING = { stiffness: 313, damping: 32.6, mass: 1, reduceMotion: ReduceMotion.System };
const BADGE_OUT_SPRING = { stiffness: 376, damping: 38, mass: 1, reduceMotion: ReduceMotion.System };
const TOGGLE_SETTLE_MS = 500;
const FIRST_DRAWN_FRAME_DELAY_MS = 1;
const COVER_HANDOFF_MS = 50;

const slideTo = (offset: number) => {
	'worklet';
	return withDelay(FIRST_DRAWN_FRAME_DELAY_MS, withSpring(offset, SECTION_SPRING));
};

const jumpTo = (offset: number) => {
	'worklet';
	return withTiming(offset, { duration: 0 });
};

const isOnScreen = (globalOriginY: number, height: number, windowHeight: number) => {
	'worklet';
	return globalOriginY + height > 0 && globalOriginY < windowHeight;
};

const reflow = (values: LayoutAnimationsValues) => {
	'worklet';
	const { windowHeight } = values;
	const isVisible =
		isOnScreen(values.currentGlobalOriginY, values.currentHeight, windowHeight) ||
		isOnScreen(values.targetGlobalOriginY, values.targetHeight, windowHeight);
	const moveTo = isVisible ? slideTo : jumpTo;
	return {
		initialValues: {
			originX: values.currentOriginX,
			originY: values.currentOriginY,
			width: values.currentWidth,
			height: values.currentHeight
		},
		animations: {
			originX: moveTo(values.targetOriginX),
			originY: moveTo(values.targetOriginY),
			width: moveTo(values.targetWidth),
			height: moveTo(values.targetHeight)
		}
	};
};

export const SECTION_REFLOW: ILayoutAnimationBuilder = { build: () => reflow };

const coverExiting: EntryExitAnimationFunction = () => {
	'worklet';
	return {
		initialValues: {},
		animations: { opacity: withDelay(COVER_HANDOFF_MS, withTiming(0, { duration: 0 })) }
	};
};

export const useSectionToggleAnimation = (
	collapsedGroups: ReadonlySet<string>,
	toggleGroup: (group: string) => void,
	rowCount: number
) => {
	const isToggling = useSharedValue(false);
	const coverOffset = useSharedValue(0);
	const { cover, setHeaderBottom } = useSectionReveal(collapsedGroups, rowCount);

	useEffect(() => {
		const settle = setTimeout(() => isToggling.set(false), TOGGLE_SETTLE_MS);
		return () => clearTimeout(settle);
	}, [collapsedGroups, isToggling]);

	const onToggle = (group: string, headerBottom: number) => {
		isToggling.set(true);
		setHeaderBottom(headerBottom);
		toggleGroup(group);
	};

	const fadeTo = (toValue: number, spring: WithSpringConfig) => {
		'worklet';
		return isToggling.get()
			? withDelay(FIRST_DRAWN_FRAME_DELAY_MS, withSpring(toValue, spring))
			: withTiming(toValue, { duration: 0 });
	};

	const fade =
		(fromOpacity: number, toOpacity: number, spring: WithSpringConfig): EntryExitAnimationFunction =>
		() => {
			'worklet';
			return { initialValues: { opacity: fromOpacity }, animations: { opacity: fadeTo(toOpacity, spring) } };
		};

	const rowEntering = fade(0, 1, SECTION_SPRING);
	const rowExiting = fade(1, 0, SECTION_SPRING);
	const badgeEntering = fade(0, 1, BADGE_IN_SPRING);
	const badgeExiting = fade(1, 0, BADGE_OUT_SPRING);

	const coverEntering: EntryExitAnimationFunction = () => {
		'worklet';
		const { distance, travel } = cover;
		const onScreenOffset = coverOffset.get() - distance;
		const startOffset = distance > 0 ? onScreenOffset : Math.min(onScreenOffset, travel);
		const settledOffset = distance > 0 ? travel - distance : 0;
		coverOffset.set(startOffset);
		coverOffset.set(slideTo(settledOffset));
		return {
			initialValues: { opacity: 1, transform: [{ translateY: startOffset }] },
			animations: {
				opacity: withDelay(TOGGLE_SETTLE_MS, withTiming(0, { duration: 0 })),
				transform: [{ translateY: slideTo(settledOffset) }]
			}
		};
	};

	return {
		onToggle,
		rowEntering,
		rowExiting,
		badgeEntering,
		badgeExiting,
		revealKey: cover.revealKey,
		coverEntering: cover.revealKey ? coverEntering : undefined,
		coverExiting
	};
};
