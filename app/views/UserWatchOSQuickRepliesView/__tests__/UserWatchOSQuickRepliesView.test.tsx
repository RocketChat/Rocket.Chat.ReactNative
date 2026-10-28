import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import UserWatchOSQuickRepliesView from '..';
import I18n from '~/i18n';
import { selectServerSuccess } from '~/actions/server';
import { getWatchOSQuickRepliesKey } from '~/lib/constants/keys';
import UserPreferences from '~/lib/methods/userPreferences';
import { DEFAULT_QUICK_REPLIES_MAX, DEFAULT_QUICK_REPLY_MAX_LENGTH } from '~/lib/methods/watchOSQuickReplies/constants';
import { addSettings } from '~/actions/settings';
import type { TSettingsState } from '~/reducers/settings';
import { syncWatchOSQuickReplies } from '~/lib/methods/watchOSQuickReplies/syncReplies';
import { showToast } from '~/lib/methods/helpers/showToast';
import { createMockedStore } from '~/reducers/mockedStore';

jest.mock('~/lib/methods/watchOSQuickReplies/syncReplies', () => ({ syncWatchOSQuickReplies: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));

const server = 'https://open.rocket.chat';
const key = getWatchOSQuickRepliesKey(server);
const navigation = { setOptions: jest.fn() } as any;

const renderView = (settings: TSettingsState = {}) => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server, version: '8.9.0', name: 'Open' }));
	store.dispatch(addSettings(settings));
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
		const full = Array.from({ length: DEFAULT_QUICK_REPLIES_MAX }, (_, i) => `Reply ${i}`);
		UserPreferences.setString(key, JSON.stringify(full));
		const { getByPlaceholderText } = renderView();
		const input = getByPlaceholderText(I18n.t('Add_Quick_Reply'));

		act(() => fireEvent.changeText(input, 'One more'));
		act(() => fireEvent(input, 'submitEditing'));

		expect(stored()).toEqual(full);
		expect(showToast).toHaveBeenCalledWith(I18n.t('Quick_replies_limit_reached', { max: DEFAULT_QUICK_REPLIES_MAX }));
	});

	it('stops adding at the max count the server sends and shows it', () => {
		UserPreferences.setString(key, JSON.stringify(['Yes', 'No']));
		const { getByPlaceholderText, getByText } = renderView({
			Apple_Watch_Quick_Actions_Max_Count: 2,
			Apple_Watch_Quick_Actions_Max_Length: 8
		});
		const input = getByPlaceholderText(I18n.t('Add_Quick_Reply'));

		act(() => fireEvent.changeText(input, 'One more'));
		act(() => fireEvent(input, 'submitEditing'));

		expect(stored()).toEqual(['Yes', 'No']);
		expect(showToast).toHaveBeenCalledWith(I18n.t('Quick_replies_limit_reached', { max: 2 }));
		expect(getByText(I18n.t('Apple_Watch_Quick_Replies_Description', { max: 2, length: 8 }))).toBeTruthy();
	});

	it('keeps every reply of a list that is already longer than a lowered limit', () => {
		const longer = ['Yes', 'No', 'Maybe'];
		UserPreferences.setString(key, JSON.stringify(longer));
		const { getByTestId } = renderView({ Apple_Watch_Quick_Actions_Max_Count: 2 });

		longer.forEach(reply => expect(getByTestId(`watchos-quick-reply-${reply}`)).toBeTruthy());
		expect(stored()).toEqual(longer);
	});

	it('skips a duplicate without the limit toast once the list is full', () => {
		const full = Array.from({ length: DEFAULT_QUICK_REPLIES_MAX }, (_, i) => `Reply ${i}`);
		UserPreferences.setString(key, JSON.stringify(full));
		const { getByPlaceholderText } = renderView();
		const input = getByPlaceholderText(I18n.t('Add_Quick_Reply'));

		act(() => fireEvent.changeText(input, 'Reply 0'));
		act(() => fireEvent(input, 'submitEditing'));

		expect(stored()).toEqual(full);
		expect(showToast).not.toHaveBeenCalled();
		expect(input.props.value).toBe('');
	});

	it('stops typing at the default max length when the server sends none', async () => {
		const { getByPlaceholderText } = renderView();

		await userEvent.setup().type(getByPlaceholderText(I18n.t('Add_Quick_Reply')), 'a'.repeat(DEFAULT_QUICK_REPLY_MAX_LENGTH + 5));

		expect(getByPlaceholderText(I18n.t('Add_Quick_Reply')).props.value).toBe('a'.repeat(DEFAULT_QUICK_REPLY_MAX_LENGTH));
	});

	it('stops typing at the max length the server sends', async () => {
		const { getByPlaceholderText } = renderView({ Apple_Watch_Quick_Actions_Max_Length: 6 });

		await userEvent.setup().type(getByPlaceholderText(I18n.t('Add_Quick_Reply')), 'a'.repeat(10));

		expect(getByPlaceholderText(I18n.t('Add_Quick_Reply')).props.value).toBe('a'.repeat(6));
	});
});
