import { act, render, renderHook } from '@testing-library/react-native';

import { type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { useConferenceMenus } from '../useConferenceMenus';
import PeopleSheetContent from '../PeopleSheetContent';

const mockActionSheet = { showActionSheet: jest.fn(), hideActionSheet: jest.fn() };

jest.mock('~/containers/ActionSheet', () => ({ useActionSheet: () => mockActionSheet }));
jest.mock('../PeopleSheetContent', () => ({ __esModule: true, default: () => null }));
jest.mock('../AddParticipantsSheetContent', () => ({ __esModule: true, default: () => null }));
jest.mock('../ChatAccessSheetContent', () => ({ __esModule: true, default: () => null }));
jest.mock('../ConnectionInfoSheetContent', () => ({ __esModule: true, default: () => null }));
jest.mock('../ReactionPicker', () => ({ __esModule: true, default: () => null }));
jest.mock('~/lib/services/conference/livekit', () => ({ AudioSession: {} }));
jest.mock('~/lib/services/conference/ConferenceSession', () => ({ conferenceSession: {} }));
jest.mock('~/lib/services/conference/conferencePictureInPicture', () => ({ enterConferencePictureInPicture: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));

const setup = ({ isScreenSharing = false, onToggleScreenShare = jest.fn(), peopleCount = 3 } = {}) => {
	const { result, unmount } = renderHook(() => useConferenceMenus({ isScreenSharing, onToggleScreenShare, peopleCount }));
	return { result, unmount, onToggleScreenShare };
};

const openMore = (result: ReturnType<typeof setup>['result']): TActionSheetOptionsItem[] => {
	act(() => result.current.showMore());
	return mockActionSheet.showActionSheet.mock.lastCall[0].options;
};

describe('useConferenceMenus', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('the more menu', () => {
		it('lists the people first, with how many are in the call beside them', () => {
			const { result } = setup({ peopleCount: 5 });

			const options = openMore(result);

			expect(options[0].title).toBe('People');
			expect(options[0].accessibilityLabel).toBe('People. 5');
			const { getByText } = render(options[0].right?.() ?? <></>);
			expect(getByText('5')).toBeTruthy();
		});

		it('offers to share the screen', () => {
			const { result } = setup();

			const titles = openMore(result).map(({ title }) => title);

			expect(titles).toContain('Share screen');
			expect(titles).not.toContain('Stop sharing screen');
		});

		it('offers to stop once the screen is being shared', () => {
			const { result } = setup({ isScreenSharing: true });

			const titles = openMore(result).map(({ title }) => title);

			expect(titles).toContain('Stop sharing screen');
			expect(titles).not.toContain('Share screen');
		});

		it('shares or stops through the callback it was given', () => {
			const { result, onToggleScreenShare } = setup();

			openMore(result)
				.find(({ title }) => title === 'Share screen')
				?.onPress();

			expect(onToggleScreenShare).toHaveBeenCalledTimes(1);
		});

		it('keeps the layout, camera, picture in picture and connection options', () => {
			const { result } = setup();

			const titles = openMore(result).map(({ title }) => title);

			expect(titles).toEqual(
				expect.arrayContaining(['Layout', 'Switch camera', 'Send resolution (maximum)', 'Picture in picture', 'Connection info'])
			);
		});

		it('does not open the next sheet when the call is left while the more menu is closing', () => {
			jest.useFakeTimers();
			const { result, unmount } = setup();
			openMore(result)[0].onPress();

			unmount();
			act(() => {
				jest.advanceTimersByTime(300);
			});

			expect(mockActionSheet.showActionSheet).toHaveBeenCalledTimes(1);
		});

		it('opens the people list once the more menu has closed', () => {
			jest.useFakeTimers();
			const { result } = setup();
			const people = openMore(result)[0];

			people.onPress();
			expect(mockActionSheet.showActionSheet).toHaveBeenCalledTimes(1);

			act(() => {
				jest.advanceTimersByTime(300);
			});

			expect(mockActionSheet.showActionSheet).toHaveBeenCalledTimes(2);
			expect(mockActionSheet.showActionSheet.mock.lastCall[0].children.type).toBe(PeopleSheetContent);
		});
	});
});
