import { StyleSheet } from 'react-native';
import { act, render } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import AvatarSkeleton from '../AvatarSkeleton';

const styles = StyleSheet.create({
	avatar: {
		width: 25,
		height: 25,
		borderRadius: 4
	}
});
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('AvatarSkeleton', () => {
	it('appears after the delay', () => {
		const { queryByTestId } = render(<AvatarSkeleton style={styles.avatar} />);
		advance(149);
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		advance(1);
		expect(queryByTestId('avatar-skeleton')).toBeTruthy();
	});

	it('shimmers when Reduce Motion is off', () => {
		const { UNSAFE_getByType } = render(<AvatarSkeleton style={styles.avatar} />);
		advance(150);
		expect(UNSAFE_getByType(SkeletonPlaceholder).props.speed).toBeUndefined();
	});

	it('stays static when Reduce Motion is on', () => {
		jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
		const { UNSAFE_getByType } = render(<AvatarSkeleton style={styles.avatar} />);
		advance(150);
		expect(UNSAFE_getByType(SkeletonPlaceholder).props.speed).toBe(0);
	});
});
