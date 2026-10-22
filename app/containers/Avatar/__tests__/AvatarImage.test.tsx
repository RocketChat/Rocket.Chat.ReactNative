import { act, fireEvent, render } from '@testing-library/react-native';
import { Image } from 'expo-image';
import { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import AvatarImage from '../AvatarImage';

const style = { width: 25, height: 25, borderRadius: 4 };
const showDelay = () => act(() => jest.advanceTimersByTime(150));
const pulseOpacity = () => jest.mocked(useAnimatedStyle).mock.lastCall?.[0]().opacity;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AvatarImage', () => {
	it('shows the skeleton until the image loads', () => {
		const { getByTestId, queryByTestId, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		act(() => jest.advanceTimersByTime(149));
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		act(() => jest.advanceTimersByTime(1));
		expect(getByTestId('avatar-skeleton')).toBeTruthy();
		fireEvent(UNSAFE_getByType(Image), 'load');
		expect(queryByTestId('avatar-skeleton')).toBeNull();
	});

	it('hides the skeleton when the image fails to load', () => {
		const { queryByTestId, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		showDelay();
		fireEvent(UNSAFE_getByType(Image), 'error');
		expect(queryByTestId('avatar-skeleton')).toBeNull();
	});

	it('shows the skeleton again when the uri changes', () => {
		const { getByTestId, queryByTestId, rerender, UNSAFE_getByType } = render(
			<AvatarImage uri='https://a/1.png' style={style} />
		);
		fireEvent(UNSAFE_getByType(Image), 'load');
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		rerender(<AvatarImage uri='https://a/2.png' style={style} />);
		showDelay();
		expect(getByTestId('avatar-skeleton')).toBeTruthy();
	});

	it('restarts the delay when the uri changes after a load', () => {
		const { queryByTestId, rerender, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		showDelay();
		fireEvent(UNSAFE_getByType(Image), 'load');
		rerender(<AvatarImage uri='https://a/2.png' style={style} />);
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		showDelay();
		expect(queryByTestId('avatar-skeleton')).toBeTruthy();
	});

	it('never shows the skeleton when the image loads before the delay', () => {
		const { queryByTestId, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		fireEvent(UNSAFE_getByType(Image), 'load');
		showDelay();
		expect(queryByTestId('avatar-skeleton')).toBeNull();
	});

	it('runs one shared pulse until the last skeleton unmounts', () => {
		jest.mocked(withTiming).mockClear();
		const first = render(<AvatarImage uri='https://a/1.png' style={style} />);
		const second = render(<AvatarImage uri='https://a/2.png' style={style} />);
		showDelay();
		expect(withTiming).toHaveBeenCalledTimes(1);
		expect(pulseOpacity()).toBeLessThan(1);
		first.unmount();
		expect(pulseOpacity()).toBeLessThan(1);
		second.unmount();
		expect(pulseOpacity()).toBe(1);
	});
});
