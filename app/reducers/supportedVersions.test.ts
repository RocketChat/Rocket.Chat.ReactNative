import { TSVMessage } from '../definitions';
import { setSupportedVersions } from '../actions/supportedVersions';
import { mockedStore } from './mockedStore';
import { initialState } from './supportedVersions';

describe('test supportedVersions reducer', () => {
	test('initial state', () => {
		const state = mockedStore.getState().supportedVersions;
		expect(state).toEqual(initialState);
	});

	test('set supported versions', () => {
		const status = 'supported';
		const message: TSVMessage = {
			remainingDays: 15,
			title: 'title',
			subtitle: 'subtitle',
			description: 'description',
			type: 'info',
			link: 'Docs page'
		};
		const i18n = {
			en: {
				title: '{{workspace-name}} is running an unsupported version of Rocket.Chat',
				subtitle: 'Mobile and desktop app access to {{workspace-name}} will be cut off in XX days.',
				description:
					'An automatic 30-day warning period has been applied to allow time for a workspace admin to update workspace to a supported software version.'
			}
		};
		mockedStore.dispatch(setSupportedVersions({ status, message, i18n }));
		const state = mockedStore.getState().supportedVersions;
		expect(state).toEqual({ status, message, i18n });
	});
});
