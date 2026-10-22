import { act, render } from '@testing-library/react-native';

import AvatarSkeleton from '../AvatarSkeleton';

const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

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
});
