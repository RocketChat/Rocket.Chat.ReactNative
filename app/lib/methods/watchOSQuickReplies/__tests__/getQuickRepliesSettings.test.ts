import log from '../../helpers/log';
import { fetchForWorkspace } from '../../serverBasicAuth';
import { getQuickRepliesSettings } from '../getQuickRepliesSettings';

jest.mock('../../serverBasicAuth', () => ({ fetchForWorkspace: jest.fn() }));
jest.mock('../../helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const server = 'https://open.rocket.chat';

const respond = (body: object) => jest.mocked(fetchForWorkspace).mockResolvedValue({ json: async () => body } as Response);

describe('getQuickRepliesSettings', () => {
	it('fetches only the quick replies settings of the given workspace', async () => {
		respond({ success: true, settings: [] });

		await getQuickRepliesSettings(server);

		expect(fetchForWorkspace).toHaveBeenCalledWith(
			server,
			`${server}/api/v1/settings.public?_id=Apple_Watch_Quick_Actions,Apple_Watch_Quick_Actions_Max_Count,Apple_Watch_Quick_Actions_Max_Length`
		);
	});

	it('returns the settings parsed by their types', async () => {
		respond({
			success: true,
			settings: [
				{ _id: 'Apple_Watch_Quick_Actions', value: 'Yes,No' },
				{ _id: 'Apple_Watch_Quick_Actions_Max_Count', value: 3 }
			]
		});

		expect(await getQuickRepliesSettings(server)).toEqual({
			Apple_Watch_Quick_Actions: 'Yes,No',
			Apple_Watch_Quick_Actions_Max_Count: 3
		});
	});

	it('returns no settings when the request fails', async () => {
		respond({ success: false, error: 'error' });

		expect(await getQuickRepliesSettings(server)).toEqual({});
	});

	it('logs and returns no settings when the workspace cannot be reached', async () => {
		const error = new Error('Network request failed');
		jest.mocked(fetchForWorkspace).mockRejectedValue(error);

		expect(await getQuickRepliesSettings(server)).toEqual({});
		expect(log).toHaveBeenCalledWith(error);
	});
});
