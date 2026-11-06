import { act, fireEvent, render } from '@testing-library/react-native';
import { Image } from 'expo-image';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import AvatarImage from '../AvatarImage';
import { SKELETON_DELAY } from '../constants';

const style = { width: 25, height: 25, borderRadius: 4 };
const showDelay = () => act(() => jest.advanceTimersByTime(SKELETON_DELAY));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AvatarImage', () => {
	it('shows the skeleton until the image loads', () => {
		const { UNSAFE_getByType, UNSAFE_queryByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		expect(UNSAFE_queryByType(SkeletonPlaceholder)).toBeNull();
		showDelay();
		expect(UNSAFE_getByType(SkeletonPlaceholder)).toBeTruthy();
		fireEvent(UNSAFE_getByType(Image), 'load');
		expect(UNSAFE_queryByType(SkeletonPlaceholder)).toBeNull();
	});

	it('hides the skeleton when the image fails to load', () => {
		const { UNSAFE_getByType, UNSAFE_queryByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		showDelay();
		fireEvent(UNSAFE_getByType(Image), 'error');
		expect(UNSAFE_queryByType(SkeletonPlaceholder)).toBeNull();
	});

	it('restarts the delay when the uri changes after a load', () => {
		const { rerender, UNSAFE_getByType, UNSAFE_queryByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		showDelay();
		fireEvent(UNSAFE_getByType(Image), 'load');
		rerender(<AvatarImage uri='https://a/2.png' style={style} />);
		expect(UNSAFE_queryByType(SkeletonPlaceholder)).toBeNull();
		showDelay();
		expect(UNSAFE_queryByType(SkeletonPlaceholder)).toBeTruthy();
	});

	it('keeps the skeleton when the uri changes before the image loads', () => {
		const { rerender, UNSAFE_getByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		showDelay();
		rerender(<AvatarImage uri='https://a/2.png' style={style} />);
		expect(UNSAFE_getByType(SkeletonPlaceholder)).toBeTruthy();
	});

	it('hides the skeleton when the uri is removed after a load', () => {
		const { rerender, UNSAFE_getByType, UNSAFE_queryByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		fireEvent(UNSAFE_getByType(Image), 'load');
		rerender(<AvatarImage uri={undefined} style={style} />);
		showDelay();
		expect(UNSAFE_queryByType(SkeletonPlaceholder)).toBeNull();
	});

	it('never shows the skeleton when the image loads before the delay', () => {
		const { UNSAFE_getByType, UNSAFE_queryByType } = render(<AvatarImage uri='https://a/1.png' style={style} />);
		act(() => jest.advanceTimersByTime(SKELETON_DELAY - 1));
		expect(UNSAFE_queryByType(SkeletonPlaceholder)).toBeNull();
		fireEvent(UNSAFE_getByType(Image), 'load');
		showDelay();
		expect(UNSAFE_queryByType(SkeletonPlaceholder)).toBeNull();
	});
});
