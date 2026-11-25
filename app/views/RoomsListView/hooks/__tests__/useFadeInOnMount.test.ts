import { renderHook } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import { type IMountFade, useFadeInOnMount } from '../useFadeInOnMount';

const spring = { stiffness: 520, damping: 45.6, mass: 1 };

const opacityOf = (style: unknown) => (style as () => { opacity: number })().opacity;

describe('useFadeInOnMount', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Reanimated, 'withDelay').mockImplementation((_delay, animation) => animation);
		jest.spyOn(Reanimated, 'withSpring').mockImplementation(toValue => toValue);
	});

	it('renders a view mounted outside a toggle fully opaque, without a spring', () => {
		const { result } = renderHook(() => useFadeInOnMount({ fadesOnMount: () => false, spring }));

		expect(Reanimated.useSharedValue).toHaveBeenCalledWith(1);
		expect(Reanimated.withSpring).not.toHaveBeenCalled();
		expect(opacityOf(result.current)).toBe(1);
	});

	it('mounts a view inside a toggle transparent and springs it to fully opaque', () => {
		const { result } = renderHook(() => useFadeInOnMount({ fadesOnMount: () => true, spring }));

		expect(Reanimated.useSharedValue).toHaveBeenCalledWith(0);
		expect(Reanimated.withSpring).toHaveBeenCalledWith(1, spring);
		expect(opacityOf(result.current)).toBe(1);
	});

	it('decides once on mount, so a toggle starting later does not fade a mounted view', () => {
		let fadeIn: IMountFade = { fadesOnMount: () => false, spring };
		const { result, rerender } = renderHook(() => useFadeInOnMount(fadeIn));

		fadeIn = { fadesOnMount: () => true, spring };
		rerender({});

		expect(Reanimated.withSpring).not.toHaveBeenCalled();
		expect(opacityOf(result.current)).toBe(1);
	});
});
