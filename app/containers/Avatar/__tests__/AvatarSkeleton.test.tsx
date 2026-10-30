import { StyleSheet, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import MaskedView from '@react-native-masked-view/masked-view';

import AvatarSkeleton from '../AvatarSkeleton';
import { SKELETON_DELAY } from '../constants';

const styles = StyleSheet.create({
	avatar: {
		width: 25,
		height: 25,
		borderRadius: 4
	}
});
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AvatarSkeleton', () => {
	it('appears after the delay', () => {
		const { queryByTestId } = render(<AvatarSkeleton style={styles.avatar} />);
		advance(SKELETON_DELAY - 1);
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		advance(1);
		expect(queryByTestId('avatar-skeleton')).toBeTruthy();
	});

	it('masks the shimmer to the size and radius of the avatar once laid out', () => {
		const { UNSAFE_getAllByType, UNSAFE_getByType } = render(<AvatarSkeleton style={styles.avatar} />);
		advance(SKELETON_DELAY);
		const measured = UNSAFE_getAllByType(View).find(view => view.props.onLayout);
		fireEvent(measured!, 'layout', { nativeEvent: { layout: { width: 25, height: 25 } } });
		const mask = render(UNSAFE_getByType(MaskedView).props.maskElement);
		const boxes = mask.UNSAFE_getAllByType(View).map(view => StyleSheet.flatten(view.props.style));
		expect(boxes).toContainEqual(expect.objectContaining({ width: 25, height: 25, borderRadius: 4 }));
	});
});
