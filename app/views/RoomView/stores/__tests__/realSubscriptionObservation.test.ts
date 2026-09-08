import { createSubscriptionRecord, setupRealSubscriptionObservation, writeColumn } from './realSubscriptionHarness';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../services/getMessages', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/methods/loadThreadMessages', () => ({
	loadThreadMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/services/restApi', () => ({
	getUserInfo: jest.fn()
}));
jest.mock('../../../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'uid-1'),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => true)
}));
jest.mock('../../../../lib/methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());

describe('real Subscription record through the Room store observer', () => {
	it.failing('keeps one snapshot when a sync rewrites roles with a content-equal payload (ticket 05 un-skips)', () => {
		const record = createSubscriptionRecord();
		const { emit, snapshotCount } = setupRealSubscriptionObservation({ record });

		emit([record]);
		const afterFirstEmission = snapshotCount();

		writeColumn(record, 'roles', '[ "owner" ]');
		emit([record]);

		expect(snapshotCount()).toBe(afterFirstEmission);
	});

	it.failing('keeps one snapshot on the first emission of the record the store was created with (ticket 05 un-skips)', () => {
		const record = createSubscriptionRecord();
		const { emit, snapshotCount } = setupRealSubscriptionObservation({ record });

		emit([record]);

		expect(snapshotCount()).toBe(1);
	});

	it('reads the same roles array back when the rewritten payload serialises identically', () => {
		const record = createSubscriptionRecord();
		const roles = record.roles;

		writeColumn(record, 'roles', JSON.stringify(['owner']));

		expect(record.roles).toBe(roles);
	});
});
