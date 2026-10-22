import { act, render } from '@testing-library/react-native';
import { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import AvatarSkeleton from '../AvatarSkeleton';

const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));
const pulseOpacity = () => jest.mocked(useAnimatedStyle).mock.lastCall?.[0]().opacity;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AvatarSkeleton', () => {
	it('appears after the delay', () => {
		const { queryByTestId } = render(<AvatarSkeleton borderRadius={4} />);
		advance(149);
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		advance(1);
		expect(queryByTestId('avatar-skeleton')).toBeTruthy();
	});

	it('runs one shared pulse until the last skeleton unmounts', () => {
		jest.mocked(withTiming).mockClear();
		const first = render(<AvatarSkeleton borderRadius={4} />);
		const second = render(<AvatarSkeleton borderRadius={4} />);
		advance(150);
		expect(withTiming).toHaveBeenCalledTimes(1);
		expect(pulseOpacity()).toBeLessThan(1);
		first.unmount();
		expect(pulseOpacity()).toBeLessThan(1);
		second.unmount();
		expect(pulseOpacity()).toBe(1);
	});
});
