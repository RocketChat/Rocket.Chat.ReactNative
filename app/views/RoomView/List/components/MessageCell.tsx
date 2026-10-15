import { StyleSheet, type CellRendererProps } from 'react-native';
import Animated, {
	type EntryAnimationsValues,
	type LayoutAnimationsValues,
	ReduceMotion,
	withDelay,
	withSpring,
	withTiming
} from 'react-native-reanimated';

import { type TAnyMessageModel } from '~/definitions';

const REFLOW_SPRING = { stiffness: 520, damping: 45.6, mass: 1, reduceMotion: ReduceMotion.System };
const FADE_IN_DELAY_MS = 120;
const FADE_IN = { duration: 180, reduceMotion: ReduceMotion.System };
const INSTANT = { duration: 0 };

const styles = StyleSheet.create({
	cell: {
		overflow: 'hidden'
	}
});

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
	const moveTo = (target: number) => (isVisible ? withSpring(target, REFLOW_SPRING) : withTiming(target, INSTANT));
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

const fadeIn = (values: EntryAnimationsValues) => {
	'worklet';
	const isVisible = isOnScreen(values.targetGlobalOriginY, values.targetHeight, values.windowHeight);
	return {
		initialValues: { opacity: isVisible ? 0 : 1 },
		animations: { opacity: isVisible ? withDelay(FADE_IN_DELAY_MS, withTiming(1, FADE_IN)) : withTiming(1, INSTANT) }
	};
};

const MessageCell = ({ onLayout, style, children }: CellRendererProps<TAnyMessageModel>) => (
	<Animated.View layout={reflow} entering={fadeIn} onLayout={onLayout} style={[style, styles.cell]}>
		{children}
	</Animated.View>
);

export default MessageCell;
