import { addSettings, clearSettings, updateSettings } from '../actions/settings';
import { mockedStore } from './mockedStore';
import { initialState, TSettingsState } from './settings';

describe('test settings reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().settings;
		expect(state).toEqual(initialState);
	});

	const settings: TSettingsState = {
		API_Use_REST_For_DDP_Calls: true,
		FileUpload_MaxFileSize: 600857600,
		Jitsi_URL_Room_Prefix: 'RocketChat'
	};

	it('should return modified store after call addSettings action', () => {
		mockedStore.dispatch(addSettings(settings));
		const state = mockedStore.getState().settings;
		expect(state).toEqual(settings);
	});

	it('should return correctly settings after call updateSettings action', () => {
		const id = 'Jitsi_URL_Room_Prefix';
		mockedStore.dispatch(updateSettings(id, 'ChatRocket'));
		const state = mockedStore.getState().settings;
		expect(state[id]).toEqual('ChatRocket');
	});

	it('should return initial state after clearSettings', () => {
		mockedStore.dispatch(clearSettings());
		const state = mockedStore.getState().settings;
		expect(state).toEqual({});
	});
});
