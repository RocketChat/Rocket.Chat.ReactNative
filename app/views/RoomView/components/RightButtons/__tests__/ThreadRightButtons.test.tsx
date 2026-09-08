import { fireEvent, render, screen } from '@testing-library/react-native';

import { toggleFollowThread } from '../../../../../lib/methods/toggleFollowThread';
import { ThreadRightButtons } from '../ThreadRightButtons';

const mockAppState = { login: { user: { id: 'u1', username: 'user', token: 'tok' } } };
jest.mock('../../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockAppState) => unknown) => selector(mockAppState)
}));

let mockIsFollowingThread = false;
jest.mock('../../../hooks/useThreadFollowing', () => ({
	useThreadFollowing: (tmid: string, userId: string) => {
		mockFollowingArgs.push({ tmid, userId });
		return mockIsFollowingThread;
	}
}));
const mockFollowingArgs: { tmid: string; userId: string }[] = [];

jest.mock('../../../../../lib/methods/toggleFollowThread', () => ({ toggleFollowThread: jest.fn() }));

jest.mock('../../../../../containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: { children: unknown }) => ReactActual.createElement('Container', null, children),
		Item: ({
			accessibilityLabel,
			iconName,
			onPress,
			testID
		}: {
			accessibilityLabel: string;
			iconName: string;
			onPress: () => void;
			testID: string;
		}) => ReactActual.createElement('Item', { accessibilityLabel, iconName, onPress, testID })
	};
});

describe('ThreadRightButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFollowingArgs.length = 0;
		mockIsFollowingThread = false;
	});

	it('renders the follow button when the thread is not followed', () => {
		render(<ThreadRightButtons tmid='tmid-1' />);

		const followButton = screen.getByTestId('room-view-header-follow');
		expect(followButton).toHaveProp('accessibilityLabel', 'Follow thread');
		expect(followButton).toHaveProp('iconName', 'notification-disabled');
		expect(screen.queryByTestId('room-view-header-unfollow')).not.toBeOnTheScreen();
	});

	it('renders the unfollow button when the thread is followed', () => {
		mockIsFollowingThread = true;

		render(<ThreadRightButtons tmid='tmid-1' />);

		const unfollowButton = screen.getByTestId('room-view-header-unfollow');
		expect(unfollowButton).toHaveProp('accessibilityLabel', 'Unfollow thread');
		expect(unfollowButton).toHaveProp('iconName', 'notification');
		expect(screen.queryByTestId('room-view-header-follow')).not.toBeOnTheScreen();
	});

	it('reads the following state for the thread and the logged user', () => {
		render(<ThreadRightButtons tmid='tmid-1' />);

		expect(mockFollowingArgs[0]).toEqual({ tmid: 'tmid-1', userId: 'u1' });
	});

	it('follows the thread when it is not followed yet', () => {
		render(<ThreadRightButtons tmid='tmid-1' />);

		fireEvent.press(screen.getByTestId('room-view-header-follow'));

		expect(toggleFollowThread).toHaveBeenCalledWith('tmid-1', false);
	});

	it('unfollows the thread when it is followed', () => {
		mockIsFollowingThread = true;

		render(<ThreadRightButtons tmid='tmid-1' />);

		fireEvent.press(screen.getByTestId('room-view-header-unfollow'));

		expect(toggleFollowThread).toHaveBeenCalledWith('tmid-1', true);
	});
});
