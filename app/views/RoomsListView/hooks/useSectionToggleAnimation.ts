import { useRef } from 'react';
import {
	type EntryExitAnimationFunction,
	LinearTransition,
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

export const SECTION_REFLOW = LinearTransition.springify()
	.stiffness(SPRING_STIFFNESS)
	.damping(SPRING_DAMPING)
	.mass(SPRING_MASS)
	.delay(FIRST_DRAWN_FRAME_DELAY_MS)
	.reduceMotion(ReduceMotion.System);

const slideTo = (offset: number) => {
	'worklet';
	return withDelay(FIRST_DRAWN_FRAME_DELAY_MS, withSpring(offset, SECTION_SPRING));
};

const coverExiting: EntryExitAnimationFunction = () => {
	'worklet';
	return {
		initialValues: {},
		animations: { opacity: withDelay(COVER_HANDOFF_MS, withTiming(0, { duration: 0 })) }
	};
};

export const useSectionToggleAnimation = (toggleGroup: (group: string) => void) => {
	const isToggling = useSharedValue(false);
	const coverOffset = useSharedValue(0);
	const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const { cover, reveal } = useSectionReveal();

	const onToggle = (group: string, headerBottom: number, revealedRows: number) => {
		isToggling.set(true);
		clearTimeout(settleTimer.current);
		settleTimer.current = setTimeout(() => isToggling.set(false), TOGGLE_SETTLE_MS);
		reveal(headerBottom, revealedRows);
		toggleGroup(group);
	};

	const fadeTo = (toValue: number, spring: WithSpringConfig) => {
		'worklet';
		return isToggling.get()
			? withDelay(FIRST_DRAWN_FRAME_DELAY_MS, withSpring(toValue, spring))
			: withTiming(toValue, { duration: 0 });
	};

	const rowEntering: EntryExitAnimationFunction = () => {
		'worklet';
		return { initialValues: { opacity: 0 }, animations: { opacity: fadeTo(1, SECTION_SPRING) } };
	};

	const rowExiting: EntryExitAnimationFunction = () => {
		'worklet';
		return { initialValues: { opacity: 1 }, animations: { opacity: fadeTo(0, SECTION_SPRING) } };
	};

	const badgeEntering: EntryExitAnimationFunction = () => {
		'worklet';
		return { initialValues: { opacity: 0 }, animations: { opacity: fadeTo(1, BADGE_IN_SPRING) } };
	};

	const badgeExiting: EntryExitAnimationFunction = () => {
		'worklet';
		return { initialValues: { opacity: 1 }, animations: { opacity: fadeTo(0, BADGE_OUT_SPRING) } };
	};

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
