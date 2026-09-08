import { clearSettings, updateSettings } from '../../actions/settings';
import { mockedStore } from '../../reducers/mockedStore';
import { initStore } from '../store/auxStore';
import { isConferenceWindowEnabled } from './useConferenceWindow';

describe('isConferenceWindowEnabled', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		mockedStore.dispatch(clearSettings());
	});

	test('is false on a server that does not have the setting', () => {
		expect(isConferenceWindowEnabled()).toBe(false);
	});

	test('is false when the workspace has it turned off', () => {
		mockedStore.dispatch(updateSettings('VideoConf_Conference_Window_Enabled', false));

		expect(isConferenceWindowEnabled()).toBe(false);
	});

	test('is true when the workspace has it turned on', () => {
		mockedStore.dispatch(updateSettings('VideoConf_Conference_Window_Enabled', true));

		expect(isConferenceWindowEnabled()).toBe(true);
	});

	test('is false for a truthy value that is not a boolean', () => {
		mockedStore.dispatch(updateSettings('VideoConf_Conference_Window_Enabled', 'true'));

		expect(isConferenceWindowEnabled()).toBe(false);
	});
});
