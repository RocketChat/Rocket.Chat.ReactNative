import { renderHook } from '@testing-library/react-native';

import { useTeamChannelPermissions } from '../useTeamChannelPermissions';

let mockGranted: string[] = [];
let mockServerVersion: string | undefined;

jest.mock('../usePermissions', () => ({
	usePermissions: (permissions: string[]) => permissions.map(permission => mockGranted.includes(permission))
}));

jest.mock('react-redux', () => ({
	...jest.requireActual('react-redux'),
	useSelector: (selector: (state: any) => any) => selector({ server: { version: mockServerVersion } })
}));

const renderPermissions = (t: string | undefined) => renderHook(() => useTeamChannelPermissions('room-1', t)).result.current;

describe('useTeamChannelPermissions', () => {
	const scenarios = [
		{ version: '7.0.0', t: 'c', granted: ['create-team-channel'], expected: { canCreateNew: true, canAddExisting: false } },
		{ version: '7.0.0', t: 'c', granted: ['create-c'], expected: { canCreateNew: true, canAddExisting: false } },
		{ version: '7.0.0', t: 'p', granted: ['create-team-group'], expected: { canCreateNew: true, canAddExisting: false } },
		{
			version: '7.0.0',
			t: 'c',
			granted: ['create-p', 'create-team-group'],
			expected: { canCreateNew: false, canAddExisting: false }
		},
		{ version: '7.0.0', t: 'c', granted: ['move-room-to-team'], expected: { canCreateNew: false, canAddExisting: true } },
		{ version: '7.0.0', t: 'c', granted: ['add-team-channel'], expected: { canCreateNew: false, canAddExisting: false } },
		{ version: '6.0.0', t: 'c', granted: ['add-team-channel'], expected: { canCreateNew: false, canAddExisting: true } },
		{ version: '6.0.0', t: 'p', granted: ['create-p'], expected: { canCreateNew: true, canAddExisting: false } },
		{
			version: '6.0.0',
			t: 'c',
			granted: ['move-room-to-team', 'create-team-channel'],
			expected: { canCreateNew: false, canAddExisting: false }
		},
		{ version: '7.0.0', t: undefined, granted: ['create-c'], expected: { canCreateNew: true, canAddExisting: false } }
	];

	scenarios.forEach(({ version, t, granted, expected }) => {
		it(`server ${version}, room type ${t}, granted [${granted.join(', ')}]`, () => {
			mockServerVersion = version;
			mockGranted = granted;

			expect(renderPermissions(t)).toEqual(expected);
		});
	});
});
