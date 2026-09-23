import { type IAppActionButton, RoomTypeFilter, UIActionButtonContext } from '../definitions';
import { applyAuthFilter, applyCategoryFilter, applyRoomFilter, collectPermissions } from '../filters';

const button = (overrides: Partial<IAppActionButton> = {}): IAppActionButton => ({
	appId: 'app-id',
	actionId: 'action-id',
	context: UIActionButtonContext.MESSAGE_BOX_ACTION,
	labelI18n: 'label',
	...overrides
});

describe('applyRoomFilter', () => {
	test('a button with no roomTypes shows everywhere', () => {
		expect(applyRoomFilter(button(), { t: 'd' })).toBe(true);
	});

	test.each([
		[RoomTypeFilter.PUBLIC_CHANNEL, { t: 'c' }],
		[RoomTypeFilter.PRIVATE_CHANNEL, { t: 'p' }],
		[RoomTypeFilter.PUBLIC_TEAM, { t: 'c', teamMain: true }],
		[RoomTypeFilter.PRIVATE_TEAM, { t: 'p', teamMain: true }],
		[RoomTypeFilter.PUBLIC_DISCUSSION, { t: 'c', prid: 'parent' }],
		[RoomTypeFilter.PRIVATE_DISCUSSION, { t: 'p', prid: 'parent' }],
		[RoomTypeFilter.DIRECT, { t: 'd' }],
		[RoomTypeFilter.DIRECT_MULTIPLE, { t: 'd', uids: ['a', 'b', 'c'] }],
		[RoomTypeFilter.LIVE_CHAT, { t: 'l' }]
	])('%s matches its room', (roomType, room) => {
		expect(applyRoomFilter(button({ when: { roomTypes: [roomType] } }), room)).toBe(true);
	});

	test('a team filter does not match a plain channel of the same type', () => {
		expect(applyRoomFilter(button({ when: { roomTypes: [RoomTypeFilter.PUBLIC_TEAM] } }), { t: 'c' })).toBe(false);
	});

	test('a 1-on-1 DM is not a multiple direct message', () => {
		expect(applyRoomFilter(button({ when: { roomTypes: [RoomTypeFilter.DIRECT_MULTIPLE] } }), { t: 'd', uids: ['a', 'b'] })).toBe(
			false
		);
	});
});

describe('applyCategoryFilter', () => {
	test('an uncategorised button belongs to default', () => {
		expect(applyCategoryFilter(button(), 'default')).toBe(true);
		expect(applyCategoryFilter(button(), 'ai')).toBe(false);
	});

	test('an ai button is kept out of default', () => {
		expect(applyCategoryFilter(button({ category: 'ai' }), 'ai')).toBe(true);
		expect(applyCategoryFilter(button({ category: 'ai' }), 'default')).toBe(false);
	});
});

describe('applyAuthFilter', () => {
	const auth = { roles: ['user', 'owner'], permissions: { 'pin-message': ['owner'], 'delete-p': ['admin'] } };

	test('a button with no conditions always passes', () => {
		expect(applyAuthFilter(button(), auth)).toBe(true);
	});

	test('hasOnePermission passes when any listed permission is granted by a held role', () => {
		expect(applyAuthFilter(button({ when: { hasOnePermission: ['delete-p', 'pin-message'] } }), auth)).toBe(true);
		expect(applyAuthFilter(button({ when: { hasOnePermission: ['delete-p'] } }), auth)).toBe(false);
	});

	test('hasAllPermissions requires every listed permission', () => {
		expect(applyAuthFilter(button({ when: { hasAllPermissions: ['pin-message'] } }), auth)).toBe(true);
		expect(applyAuthFilter(button({ when: { hasAllPermissions: ['pin-message', 'delete-p'] } }), auth)).toBe(false);
	});

	test('an unknown permission is treated as not granted', () => {
		expect(applyAuthFilter(button({ when: { hasOnePermission: ['never-synced'] } }), auth)).toBe(false);
	});

	test('role conditions read the merged workspace and subscription roles', () => {
		expect(applyAuthFilter(button({ when: { hasOneRole: ['owner'] } }), auth)).toBe(true);
		expect(applyAuthFilter(button({ when: { hasAllRoles: ['user', 'owner'] } }), auth)).toBe(true);
		expect(applyAuthFilter(button({ when: { hasAllRoles: ['user', 'admin'] } }), auth)).toBe(false);
	});
});

describe('collectPermissions', () => {
	test('gathers every referenced permission once', () => {
		const buttons = [
			button({ when: { hasOnePermission: ['a', 'b'] } }),
			button({ when: { hasAllPermissions: ['b', 'c'] } }),
			button()
		];
		expect(collectPermissions(buttons).sort()).toEqual(['a', 'b', 'c']);
	});
});
