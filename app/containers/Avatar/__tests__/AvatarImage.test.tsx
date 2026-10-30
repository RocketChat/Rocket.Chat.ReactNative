import { act, fireEvent, render } from '@testing-library/react-native';
import { Image } from 'expo-image';

import AvatarImage from '../AvatarImage';
import { SKELETON_DELAY } from '../constants';

const showDelay = () => act(() => jest.advanceTimersByTime(SKELETON_DELAY));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AvatarImage', () => {
	it('shows the skeleton until the image loads', () => {
		const { getByTestId, queryByTestId, UNSAFE_getByType } = render(
			<AvatarImage uri='https://a/1.png' size={25} borderRadius={4} />
		);
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		showDelay();
		expect(getByTestId('avatar-skeleton')).toBeTruthy();
		fireEvent(UNSAFE_getByType(Image), 'load');
		expect(queryByTestId('avatar-skeleton')).toBeNull();
	});

	it('hides the skeleton when the image fails to load', () => {
		const { queryByTestId, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' size={25} borderRadius={4} />);
		showDelay();
		fireEvent(UNSAFE_getByType(Image), 'error');
		expect(queryByTestId('avatar-skeleton')).toBeNull();
	});

	it('restarts the delay when the uri changes after a load', () => {
		const { queryByTestId, rerender, UNSAFE_getByType } = render(
			<AvatarImage uri='https://a/1.png' size={25} borderRadius={4} />
		);
		showDelay();
		fireEvent(UNSAFE_getByType(Image), 'load');
		rerender(<AvatarImage uri='https://a/2.png' size={25} borderRadius={4} />);
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		showDelay();
		expect(queryByTestId('avatar-skeleton')).toBeTruthy();
	});

	it('keeps the skeleton when the uri changes before the image loads', () => {
		const { getByTestId, rerender } = render(<AvatarImage uri='https://a/1.png' size={25} borderRadius={4} />);
		showDelay();
		rerender(<AvatarImage uri='https://a/2.png' size={25} borderRadius={4} />);
		expect(getByTestId('avatar-skeleton')).toBeTruthy();
	});

	it('hides the skeleton when the uri is removed after a load', () => {
		const { queryByTestId, rerender, UNSAFE_getByType } = render(
			<AvatarImage uri='https://a/1.png' size={25} borderRadius={4} />
		);
		fireEvent(UNSAFE_getByType(Image), 'load');
		rerender(<AvatarImage uri={undefined} size={25} borderRadius={4} />);
		showDelay();
		expect(queryByTestId('avatar-skeleton')).toBeNull();
	});

	it('never shows the skeleton when the image loads before the delay', () => {
		const { queryByTestId, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' size={25} borderRadius={4} />);
		act(() => jest.advanceTimersByTime(SKELETON_DELAY - 1));
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		fireEvent(UNSAFE_getByType(Image), 'load');
		showDelay();
		expect(queryByTestId('avatar-skeleton')).toBeNull();
	});
});
