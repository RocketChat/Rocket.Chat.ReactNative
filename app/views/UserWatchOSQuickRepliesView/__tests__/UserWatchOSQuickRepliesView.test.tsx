import { act, fireEvent, render, userEvent } from '@testing-library/react-native';

import UserWatchOSQuickRepliesView from '..';
import I18n from '~/i18n';
import { CURRENT_SERVER, getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import UserPreferences from '~/lib/methods/userPreferences';
import { QUICK_REPLIES_MAX, QUICK_REPLY_MAX_LENGTH } from '~/lib/methods/watchOSQuickReplies/constants';
import { syncWatchOSQuickReplies } from '~/lib/methods/watchOSQuickReplies/syncReplies';
import { showToast } from '~/lib/methods/helpers/showToast';

jest.mock('~/lib/methods/watchOSQuickReplies/syncReplies', () => ({ syncWatchOSQuickReplies: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));

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

	it('removes a reply from its delete action and syncs', () => {
		const { getByTestId } = render(<UserWatchOSQuickRepliesView navigation={navigation} />);

		act(() => fireEvent.press(getByTestId('watchos-quick-reply-Yes-delete')));

		expect(UserPreferences.getString(key)).toBe('[]');
		expect(syncWatchOSQuickReplies).toHaveBeenCalledTimes(1);
		expect(syncWatchOSQuickReplies).toHaveBeenCalledWith(server);
	});

	it('keeps a reply when its row is tapped', () => {
		const { getByTestId } = render(<UserWatchOSQuickRepliesView navigation={navigation} />);

		act(() => fireEvent.press(getByTestId('watchos-quick-reply-Yes')));

		expect(stored()).toEqual(['Yes']);
		expect(syncWatchOSQuickReplies).not.toHaveBeenCalled();
	});

	it('stops adding once the list is full and says why', () => {
		const full = Array.from({ length: QUICK_REPLIES_MAX }, (_, i) => `Reply ${i}`);
		UserPreferences.setString(key, JSON.stringify(full));
		const { getByPlaceholderText } = render(<UserWatchOSQuickRepliesView navigation={navigation} />);
		const input = getByPlaceholderText(I18n.t('Add_Quick_Reply'));

		act(() => fireEvent.changeText(input, 'One more'));
		act(() => fireEvent(input, 'submitEditing'));

		expect(stored()).toEqual(full);
		expect(showToast).toHaveBeenCalledWith(I18n.t('Quick_replies_limit_reached', { max: QUICK_REPLIES_MAX }));
	});

	it('stops typing at the max length', async () => {
		const { getByPlaceholderText } = render(<UserWatchOSQuickRepliesView navigation={navigation} />);

		await userEvent.setup().type(getByPlaceholderText(I18n.t('Add_Quick_Reply')), 'a'.repeat(QUICK_REPLY_MAX_LENGTH + 5));

		expect(getByPlaceholderText(I18n.t('Add_Quick_Reply')).props.value).toBe('a'.repeat(QUICK_REPLY_MAX_LENGTH));
	});
});
