import { act, fireEvent, render } from '@testing-library/react-native';
import { Image } from 'expo-image';

import AvatarImage from './AvatarImage';

const style = { width: 25, height: 25, borderRadius: 4 };
const showDelay = () => act(() => jest.advanceTimersByTime(150));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AvatarImage', () => {
	it('shows the skeleton until the image loads', () => {
		const { getByTestId, queryByTestId, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		expect(queryByTestId('avatar-skeleton')).toBeNull();
		showDelay();
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

	it('never shows the skeleton when the image loads before the delay', () => {
		const { queryByTestId, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		fireEvent(UNSAFE_getByType(Image), 'load');
		showDelay();
		expect(queryByTestId('avatar-skeleton')).toBeNull();
	});
});
