import { canDeleteTeamChannel } from '../canDeleteTeamChannel';

const mockGrantedPermissions = new Map<string, string[]>();
let mockServerVersion = '7.0.0';

const PERMISSION_ROLES: Record<string, string[]> = {
	'delete-c': ['delete-c-role'],
	'delete-p': ['delete-p-role'],
	'delete-team-channel': ['delete-team-channel-role'],
	'delete-team-group': ['delete-team-group-role']
};

jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: () => ({ permissions: PERMISSION_ROLES, server: { version: mockServerVersion } }) }
}));
jest.mock('../helpers/hasPermission', () => ({
	hasPermission: jest.fn((permissions: string[][], rid: string) =>
		Promise.resolve(permissions.map(roles => roles.some(role => mockGrantedPermissions.get(rid)?.includes(role))))
	)
}));

const grant = (rid: string, permission: string) =>
	mockGrantedPermissions.set(rid, [...(mockGrantedPermissions.get(rid) ?? []), ...PERMISSION_ROLES[permission]]);

const publicChannel = { rid: 'channel-rid', t: 'c' } as const;
const privateGroup = { rid: 'group-rid', t: 'p' } as const;
const TEAM_RID = 'team-rid';

describe('canDeleteTeamChannel', () => {
	beforeEach(() => {
		mockGrantedPermissions.clear();
		mockServerVersion = '7.0.0';
	});

	it('allows a public channel with delete-c in it and delete-team-channel in the team', async () => {
		grant('channel-rid', 'delete-c');
		grant(TEAM_RID, 'delete-team-channel');
		expect(await canDeleteTeamChannel(publicChannel, TEAM_RID)).toBe(true);
	});

	it('allows a private group with delete-p in it and delete-team-group in the team', async () => {
		grant('group-rid', 'delete-p');
		grant(TEAM_RID, 'delete-team-group');
		expect(await canDeleteTeamChannel(privateGroup, TEAM_RID)).toBe(true);
	});

	it('refuses a channel the user can delete when the team permission is missing', async () => {
		grant('channel-rid', 'delete-c');
		expect(await canDeleteTeamChannel(publicChannel, TEAM_RID)).toBe(false);
	});

	it('refuses when the team permission is granted only on the channel, not on the team', async () => {
		grant('channel-rid', 'delete-c');
		grant('channel-rid', 'delete-team-channel');
		expect(await canDeleteTeamChannel(publicChannel, TEAM_RID)).toBe(false);
	});

	it('refuses a private group with only the public channel permissions', async () => {
		grant('group-rid', 'delete-c');
		grant(TEAM_RID, 'delete-team-channel');
		expect(await canDeleteTeamChannel(privateGroup, TEAM_RID)).toBe(false);
	});

	it('checks only the channel permission before 7.0.0', async () => {
		mockServerVersion = '6.13.0';
		grant('channel-rid', 'delete-c');
		expect(await canDeleteTeamChannel(publicChannel, TEAM_RID)).toBe(true);
	});

	it('checks only the channel permission while the server version is unknown', async () => {
		mockServerVersion = '';
		grant('channel-rid', 'delete-c');
		expect(await canDeleteTeamChannel(publicChannel, TEAM_RID)).toBe(true);
	});
});
