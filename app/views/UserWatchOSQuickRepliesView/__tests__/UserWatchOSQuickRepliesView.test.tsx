import { act, fireEvent, render } from '@testing-library/react-native';

import UserWatchOSQuickRepliesView from '..';
import I18n from '~/i18n';
import { CURRENT_SERVER, getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import UserPreferences from '~/lib/methods/userPreferences';
import { syncWatchOSQuickReplies } from '~/lib/methods/WatchOSQuickReplies/syncReplies';

jest.mock('~/lib/methods/WatchOSQuickReplies/syncReplies', () => ({ syncWatchOSQuickReplies: jest.fn() }));

const server = 'https://open.rocket.chat';
const key = getWatchOSQuickRepliesKey(server);
const navigation = { setOptions: jest.fn() } as any;

const stored = () => JSON.parse(UserPreferences.getString(key) ?? '[]');

describe('UserWatchOSQuickRepliesView', () => {
	beforeEach(() => {
		(syncWatchOSQuickReplies as jest.Mock).mockClear();
		UserPreferences.setString(CURRENT_SERVER, server);
		UserPreferences.setString(key, JSON.stringify(['Yes']));
	});

	it('adds a trimmed reply, skips duplicates and syncs', () => {
		const { getByPlaceholderText } = render(<UserWatchOSQuickRepliesView navigation={navigation} />);
		const input = getByPlaceholderText(I18n.t('Add_Quick_Reply'));

		act(() => fireEvent.changeText(input, '  On my way  '));
		act(() => fireEvent(input, 'submitEditing'));
		act(() => fireEvent.changeText(input, 'Yes'));
		act(() => fireEvent(input, 'submitEditing'));

		expect(stored()).toEqual(['Yes', 'On my way']);
		expect(syncWatchOSQuickReplies).toHaveBeenCalledTimes(2);
	});

	it('removes a reply on press and syncs', () => {
		const { getByText } = render(<UserWatchOSQuickRepliesView navigation={navigation} />);

		act(() => fireEvent.press(getByText('Yes')));

		expect(stored()).toEqual([]);
		expect(syncWatchOSQuickReplies).toHaveBeenCalledTimes(1);
	});
});
