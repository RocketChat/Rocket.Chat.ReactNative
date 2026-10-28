import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import UserWatchOSQuickRepliesView from '..';
import I18n from '~/i18n';
import { selectServerSuccess } from '~/actions/server';
import { getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import UserPreferences from '~/lib/methods/userPreferences';
import { QUICK_REPLIES_MAX, QUICK_REPLY_MAX_LENGTH } from '~/lib/methods/watchOSQuickReplies/constants';
import { syncWatchOSQuickReplies } from '~/lib/methods/watchOSQuickReplies/syncReplies';
import { showToast } from '~/lib/methods/helpers/showToast';
import { createMockedStore } from '~/reducers/mockedStore';

jest.mock('~/lib/methods/watchOSQuickReplies/syncReplies', () => ({ syncWatchOSQuickReplies: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));

const server = 'https://open.rocket.chat';
const key = getWatchOSQuickRepliesKey(server);
const navigation = { setOptions: jest.fn() } as any;

const renderView = () => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server, version: '8.9.0', name: 'Open' }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	return render(<UserWatchOSQuickRepliesView navigation={navigation} />, { wrapper: Wrapper });
};

const stored = () => JSON.parse(UserPreferences.getString(key) ?? '[]');

describe('UserWatchOSQuickRepliesView', () => {
	beforeEach(() => {
		(syncWatchOSQuickReplies as jest.Mock).mockReset();
		(showToast as jest.Mock).mockClear();
		UserPreferences.setString(key, JSON.stringify(['Yes']));
	});

	it('adds a trimmed reply, skips duplicates and syncs after saving', () => {
		const storedAtSync: string[][] = [];
		jest.mocked(syncWatchOSQuickReplies).mockImplementation(() => {
			storedAtSync.push(stored());
		});
		const { getByPlaceholderText } = renderView();
		const input = getByPlaceholderText(I18n.t('Add_Quick_Reply'));

		act(() => fireEvent.changeText(input, '  On my way  '));
		act(() => fireEvent(input, 'submitEditing'));
		act(() => fireEvent.changeText(input, 'Yes'));
		act(() => fireEvent(input, 'submitEditing'));

		expect(stored()).toEqual(['Yes', 'On my way']);
		expect(storedAtSync).toEqual([
			['Yes', 'On my way'],
			['Yes', 'On my way']
		]);
	});

	it('removes a reply from its delete action and syncs after saving', () => {
		const storedAtSync: string[][] = [];
		jest.mocked(syncWatchOSQuickReplies).mockImplementation(() => {
			storedAtSync.push(stored());
		});
		const { getByTestId } = renderView();

		act(() => fireEvent.press(getByTestId('watchos-quick-reply-Yes-delete')));

		expect(UserPreferences.getString(key)).toBe('[]');
		expect(storedAtSync).toEqual([[]]);
		expect(syncWatchOSQuickReplies).toHaveBeenCalledWith(server);
	});

	it('keeps a reply when its row is tapped', () => {
		const { getByTestId } = renderView();

		act(() => fireEvent.press(getByTestId('watchos-quick-reply-Yes')));

		expect(stored()).toEqual(['Yes']);
		expect(syncWatchOSQuickReplies).not.toHaveBeenCalled();
	});

	it('stops adding once the list is full and says why', () => {
		const full = Array.from({ length: QUICK_REPLIES_MAX }, (_, i) => `Reply ${i}`);
		UserPreferences.setString(key, JSON.stringify(full));
		const { getByPlaceholderText } = renderView();
		const input = getByPlaceholderText(I18n.t('Add_Quick_Reply'));

		act(() => fireEvent.changeText(input, 'One more'));
		act(() => fireEvent(input, 'submitEditing'));

		expect(stored()).toEqual(full);
		expect(showToast).toHaveBeenCalledWith(I18n.t('Quick_replies_limit_reached', { max: QUICK_REPLIES_MAX }));
	});

	it('skips a duplicate without the limit toast once the list is full', () => {
		const full = Array.from({ length: QUICK_REPLIES_MAX }, (_, i) => `Reply ${i}`);
		UserPreferences.setString(key, JSON.stringify(full));
		const { getByPlaceholderText } = renderView();
		const input = getByPlaceholderText(I18n.t('Add_Quick_Reply'));

		act(() => fireEvent.changeText(input, 'Reply 0'));
		act(() => fireEvent(input, 'submitEditing'));

		expect(stored()).toEqual(full);
		expect(showToast).not.toHaveBeenCalled();
		expect(input.props.value).toBe('');
	});

	it('stops typing at the max length', async () => {
		const { getByPlaceholderText } = renderView();

		await userEvent.setup().type(getByPlaceholderText(I18n.t('Add_Quick_Reply')), 'a'.repeat(QUICK_REPLY_MAX_LENGTH + 5));

		expect(getByPlaceholderText(I18n.t('Add_Quick_Reply')).props.value).toBe('a'.repeat(QUICK_REPLY_MAX_LENGTH));
	});
});
