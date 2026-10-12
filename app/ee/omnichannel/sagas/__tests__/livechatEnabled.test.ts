jest.mock('~/lib/services/restApi', () => ({ getRoutingConfig: jest.fn() }));
jest.mock('~/lib/methods/enterpriseModules', () => ({ isOmnichannelModuleAvailable: jest.fn() }));
jest.mock('~/ee/omnichannel/lib/subscriptions/inquiry', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/ee/omnichannel/lib', () => ({ ...jest.requireActual('~/ee/omnichannel/lib'), getInquiriesQueued: jest.fn() }));

import { setUser } from '~/actions/login';
import { updateSettings } from '~/actions/settings';
import { inquiryRequest } from '~/ee/omnichannel/actions/inquiry';
import { getInquiriesQueued } from '~/ee/omnichannel/lib';
import subscribeInquiry from '~/ee/omnichannel/lib/subscriptions/inquiry';
import { isOmnichannelModuleAvailable } from '~/lib/methods/enterpriseModules';
import { getRoutingConfig } from '~/lib/services/restApi';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import { type IOmnichannelRoom } from '~/definitions';
import inquiryRoot from '../inquiry';

const INQUIRIES = [{ _id: 'inquiry-1' }, { _id: 'inquiry-2' }] as IOmnichannelRoom[];

const setup = async (statusLivechat?: string) => {
	const stopSubscription = jest.fn();
	jest.mocked(subscribeInquiry).mockReturnValue({ stop: stopSubscription } as never);
	jest.mocked(getRoutingConfig).mockResolvedValue({ showQueue: true } as never);
	jest.mocked(getInquiriesQueued).mockResolvedValue({ success: true, inquiries: INQUIRIES } as never);
	jest.mocked(isOmnichannelModuleAvailable).mockReturnValue(true);

	const { store } = createRecordingStore(inquiryRoot);
	store.dispatch(setUser({ statusLivechat }));
	store.dispatch(inquiryRequest());
	await flushSagaMicrotasks();
	return { store, stopSubscription };
};

const changeLivechatEnabled = async (store: ReturnType<typeof createRecordingStore>['store'], value: boolean) => {
	store.dispatch(updateSettings('Livechat_enabled', value));
	await flushSagaMicrotasks();
};

afterEach(() => {
	cancelSagaTasks();
	jest.clearAllMocks();
});

describe('inquiry saga — an admin changes Livechat_enabled while the Agent is signed in', () => {
	it('empties the Inquiry queue when Omnichannel is turned off', async () => {
		const { store } = await setup('available');
		expect(store.getState().inquiry.queued).toEqual(INQUIRIES);

		await changeLivechatEnabled(store, false);

		expect(store.getState().inquiry.queued).toEqual([]);
		expect(store.getState().inquiry.enabled).toBe(false);
	});

	it('stops the Inquiry subscription when Omnichannel is turned off', async () => {
		const { store, stopSubscription } = await setup('available');

		await changeLivechatEnabled(store, false);

		expect(stopSubscription).toHaveBeenCalledTimes(1);
	});

	it('loads the Inquiry queue again when Omnichannel is turned back on for an available Agent', async () => {
		const { store } = await setup('available');
		await changeLivechatEnabled(store, false);
		expect(store.getState().inquiry.queued).toEqual([]);

		await changeLivechatEnabled(store, true);

		expect(store.getState().inquiry.queued).toEqual(INQUIRIES);
	});

	it('requests nothing when Omnichannel is turned on for a User who is not an Agent', async () => {
		const { store } = await setup();
		jest.mocked(getRoutingConfig).mockClear();

		await changeLivechatEnabled(store, true);

		expect(getRoutingConfig).not.toHaveBeenCalled();
	});

	it('requests nothing when Omnichannel is turned on and the Workspace has no Omnichannel license', async () => {
		const { store } = await setup('available');
		jest.mocked(isOmnichannelModuleAvailable).mockReturnValue(false);
		jest.mocked(getRoutingConfig).mockClear();

		await changeLivechatEnabled(store, true);

		expect(getRoutingConfig).not.toHaveBeenCalled();
	});

	it('leaves the Inquiry queue and subscription alone when another setting changes', async () => {
		const { store, stopSubscription } = await setup('available');

		store.dispatch(updateSettings('Message_AllowDeleting', false));
		await flushSagaMicrotasks();

		expect(store.getState().inquiry.queued).toEqual(INQUIRIES);
		expect(stopSubscription).not.toHaveBeenCalled();
	});
});
