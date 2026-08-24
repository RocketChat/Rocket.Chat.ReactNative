import { type SharedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const HIDE_DELAY = 1000;
const FADE_IN_DURATION = 150;
const FADE_OUT_DURATION = 300;

interface IUseFloatingDateOpacity {
	opacity: SharedValue<number>;
	show: () => void;
}

export const useFloatingDateOpacity = (): IUseFloatingDateOpacity => {
	const opacity = useSharedValue(0);
	const isFadingIn = useSharedValue(false);

	const hide = (): void => {
		'worklet';

		opacity.set(withDelay(HIDE_DELAY, withTiming(0, { duration: FADE_OUT_DURATION })));
	};

	const show = (): void => {
		'worklet';

		if (isFadingIn.get()) {
			return;
		}
		if (opacity.get() === 1) {
			hide();
			return;
		}
		isFadingIn.set(true);
		opacity.set(
			withTiming(1, { duration: FADE_IN_DURATION }, (): void => {
				isFadingIn.set(false);
				hide();
			})
		);
	};

	return { opacity, show };
};
