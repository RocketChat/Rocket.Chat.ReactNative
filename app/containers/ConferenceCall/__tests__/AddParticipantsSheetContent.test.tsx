import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { textInputDebounceTime } from '~/lib/constants/debounceConfig';
import { usersAutoComplete } from '~/lib/services/restApi';
import { mockedStore } from '~/reducers/mockedStore';
import AddParticipantsSheetContent from '../AddParticipantsSheetContent';

jest.mock('~/containers/ActionSheet', () => ({ useActionSheet: () => ({ hideActionSheet: jest.fn() }) }));
jest.mock('~/lib/hooks/useConferenceInfo', () => ({ useConferenceInfo: () => ({ info: { rid: 'GENERAL', users: [] } }) }));
jest.mock('~/lib/hooks/usePermissions', () => ({ usePermissions: () => [true] }));
jest.mock('~/lib/methods/helpers/info', () => ({ showErrorAlertWithEMessage: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ usersAutoComplete: jest.fn(), videoConferenceAddParticipants: jest.fn() }));

const autoComplete = usersAutoComplete as jest.Mock;

const found = (...usernames: string[]) => ({
	success: true,
	items: usernames.map(username => ({ _id: username, name: username.toUpperCase(), username }))
});

const deferred = () => {
	let resolve: (value: unknown) => void = () => undefined;
	const promise = new Promise(done => {
		resolve = done;
	});
	return { promise, resolve };
};

const renderSheet = () =>
	render(
		<Provider store={mockedStore}>
			<AddParticipantsSheetContent />
		</Provider>
	);

const type = (utils: ReturnType<typeof renderSheet>, value: string) => {
	fireEvent.changeText(utils.getByTestId('conference-add-people-search'), value);
	act(() => {
		jest.advanceTimersByTime(textInputDebounceTime);
	});
};

describe('AddParticipantsSheetContent search', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('lists the people found for what was typed', async () => {
		autoComplete.mockResolvedValue(found('ada'));
		const utils = renderSheet();

		type(utils, 'ad');
		await act(async () => {});

		expect(utils.getByTestId('conference-add-candidate-ada')).toBeTruthy();
	});

	it('shows the people for the term in the field when an earlier search answers last', async () => {
		const earlier = deferred();
		const later = deferred();
		autoComplete.mockReturnValueOnce(earlier.promise).mockReturnValueOnce(later.promise);
		const utils = renderSheet();

		type(utils, 'ad');
		type(utils, 'ada');
		await act(async () => later.resolve(found('ada')));
		await act(async () => earlier.resolve(found('adam')));

		expect(utils.getByTestId('conference-add-candidate-ada')).toBeTruthy();
		expect(utils.queryByTestId('conference-add-candidate-adam')).toBeNull();
	});

	it('stays empty after the field is cleared when an earlier search answers late', async () => {
		const earlier = deferred();
		autoComplete.mockReturnValueOnce(earlier.promise);
		const utils = renderSheet();

		type(utils, 'ad');
		type(utils, '');
		await act(async () => earlier.resolve(found('adam')));

		expect(utils.queryByTestId('conference-add-candidate-adam')).toBeNull();
	});
});
