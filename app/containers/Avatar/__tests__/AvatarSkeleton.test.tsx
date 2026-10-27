import { StyleSheet } from 'react-native';
import { act, render } from '@testing-library/react-native';

import AvatarSkeleton from '../AvatarSkeleton';

const styles = StyleSheet.create({
	avatar: { width: 25, height: 25, borderRadius: 4 }
});
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AvatarSkeleton', () => {
	it('appears after the delay', () => {
		const { queryByTestId } = render(<AvatarSkeleton style={styles.avatar} />);
		advance(149);
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		advance(1);
		expect(queryByTestId('avatar-skeleton')).toBeTruthy();
	});
});
