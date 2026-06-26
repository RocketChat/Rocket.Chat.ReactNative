import { getChannelActionPermissions } from './channelActionPermissions';
import { type IItem } from './useTeamChannels';
import { type TSubscriptionModel } from '../../definitions';

const mockHasPermission = jest.fn();

jest.mock('../../lib/methods/helpers', () => ({
	hasPermission: (...args: any[]) => mockHasPermission(...args)
}));

const team = { rid: 'team-rid' } as unknown as TSubscriptionModel;

const makeItem = (overrides: Partial<IItem> = {}): IItem =>
	({
		_id: 'item-id',
		t: 'c',
		...overrides
	} as unknown as IItem);

const perms = {
	edit: ['edit-perm'],
	remove: ['remove-perm'],
	deleteC: ['delete-c-perm'],
	deleteP: ['delete-p-perm']
};

describe('getChannelActionPermissions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('issues exactly three permission checks with the correct perm-array and rid for each', async () => {
		mockHasPermission.mockResolvedValue([true]);

		await getChannelActionPermissions(makeItem(), team, perms);

		expect(mockHasPermission).toHaveBeenCalledTimes(3);
		expect(mockHasPermission).toHaveBeenCalledWith([perms.edit], 'team-rid');
		expect(mockHasPermission).toHaveBeenCalledWith([perms.remove], 'team-rid');
		expect(mockHasPermission).toHaveBeenCalledWith([perms.deleteC], 'item-id');
	});

	it('uses deleteC when item.t is "c"', async () => {
		mockHasPermission.mockResolvedValue([true]);

		await getChannelActionPermissions(makeItem({ t: 'c' }), team, perms);

		expect(mockHasPermission).toHaveBeenCalledWith([perms.deleteC], 'item-id');
		expect(mockHasPermission).not.toHaveBeenCalledWith([perms.deleteP], 'item-id');
	});

	it('uses deleteP when item.t is not "c"', async () => {
		mockHasPermission.mockResolvedValue([true]);

		await getChannelActionPermissions(makeItem({ t: 'p' }), team, perms);

		expect(mockHasPermission).toHaveBeenCalledWith([perms.deleteP], 'item-id');
		expect(mockHasPermission).not.toHaveBeenCalledWith([perms.deleteC], 'item-id');
	});

	it('maps each returned boolean from its call’s [0] element', async () => {
		mockHasPermission
			.mockImplementationOnce(() => Promise.resolve([true])) // edit -> canAutoJoin
			.mockImplementationOnce(() => Promise.resolve([false])) // remove -> canRemove
			.mockImplementationOnce(() => Promise.resolve([true])); // delete -> canDelete

		const result = await getChannelActionPermissions(makeItem(), team, perms);

		expect(result).toEqual({ canAutoJoin: true, canRemove: false, canDelete: true });
	});

	it('dispatches all three checks in parallel before any resolves', async () => {
		let resolveCount = 0;
		const callOrder: string[] = [];
		mockHasPermission.mockImplementation((permsArg: string[][]) => {
			callOrder.push(permsArg[0][0]);
			return new Promise(resolve => {
				resolveCount += 1;
				resolve([true]);
			});
		});

		const promise = getChannelActionPermissions(makeItem(), team, perms);

		// All three synchronous dispatches happened before any awaited resolution.
		expect(mockHasPermission).toHaveBeenCalledTimes(3);
		expect(callOrder).toEqual(['edit-perm', 'remove-perm', 'delete-c-perm']);
		expect(resolveCount).toBe(3);

		await promise;
	});
});
