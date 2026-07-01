import { renderHook } from '@testing-library/react-native';

import { useCreateNewPermission, useAddExistingPermission, useCanCreateTeamChannel } from './useTeamChannelPermissions';

const mockUsePermissions = jest.fn();
let mockServerVersion: string | undefined;

jest.mock('./usePermissions', () => ({
	usePermissions: (permissions: string[], rid?: string) => mockUsePermissions(permissions, rid)
}));

jest.mock('react-redux', () => ({
	...jest.requireActual('react-redux'),
	useSelector: (selector: (state: any) => any) => selector({ server: { version: mockServerVersion } })
}));

// Resolve the granted result by which permissions were requested, so a single
// mock can serve both hooks regardless of call order.
const grant = (granted: string[]) => (permissions: string[]) => permissions.map(p => granted.includes(p));

const RID = 'room-1';

describe('useTeamChannelPermissions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockServerVersion = '7.0.0';
	});

	describe('useCreateNewPermission', () => {
		it('v7+ t=c requests create-c and create-team-channel', () => {
			mockUsePermissions.mockImplementation(grant([]));
			renderHook(() => useCreateNewPermission(RID, 'c'));
			expect(mockUsePermissions).toHaveBeenCalledWith(['create-c', 'create-team-channel'], RID);
		});

		it('v7+ t=p requests create-p and create-team-group', () => {
			mockUsePermissions.mockImplementation(grant([]));
			renderHook(() => useCreateNewPermission(RID, 'p'));
			expect(mockUsePermissions).toHaveBeenCalledWith(['create-p', 'create-team-group'], RID);
		});

		it('pre-v7 t=c requests only create-c', () => {
			mockServerVersion = '6.0.0';
			mockUsePermissions.mockImplementation(grant([]));
			renderHook(() => useCreateNewPermission(RID, 'c'));
			expect(mockUsePermissions).toHaveBeenCalledWith(['create-c'], RID);
		});

		it('pre-v7 t=p requests only create-p', () => {
			mockServerVersion = '6.0.0';
			mockUsePermissions.mockImplementation(grant([]));
			renderHook(() => useCreateNewPermission(RID, 'p'));
			expect(mockUsePermissions).toHaveBeenCalledWith(['create-p'], RID);
		});

		it('returns true when any requested permission is granted', () => {
			mockUsePermissions.mockImplementation(grant(['create-team-channel']));
			const { result } = renderHook(() => useCreateNewPermission(RID, 'c'));
			expect(result.current).toBe(true);
		});

		it('returns false when no requested permission is granted', () => {
			mockUsePermissions.mockImplementation(grant([]));
			const { result } = renderHook(() => useCreateNewPermission(RID, 'c'));
			expect(result.current).toBe(false);
		});
	});

	describe('useAddExistingPermission', () => {
		it('v7+ requests move-room-to-team', () => {
			mockUsePermissions.mockImplementation(grant([]));
			renderHook(() => useAddExistingPermission(RID));
			expect(mockUsePermissions).toHaveBeenCalledWith(['move-room-to-team'], RID);
		});

		it('pre-v7 requests add-team-channel', () => {
			mockServerVersion = '6.0.0';
			mockUsePermissions.mockImplementation(grant([]));
			renderHook(() => useAddExistingPermission(RID));
			expect(mockUsePermissions).toHaveBeenCalledWith(['add-team-channel'], RID);
		});

		it('returns the first (and only) permission result', () => {
			mockUsePermissions.mockImplementation(grant(['move-room-to-team']));
			const { result } = renderHook(() => useAddExistingPermission(RID));
			expect(result.current).toBe(true);
		});
	});

	describe('useCanCreateTeamChannel — equivalence with the old async logic', () => {
		// Old v7+: t=c => moveRoomToTeam || createC || createTeamChannel ; t=p => moveRoomToTeam || createP || createTeamGroup
		// Old pre-v7: t=c => addTeamChannel || createC ; t=p => addTeamChannel || createP

		it('v7+ t=c true when only moveRoomToTeam granted', () => {
			mockUsePermissions.mockImplementation(grant(['move-room-to-team']));
			const { result } = renderHook(() => useCanCreateTeamChannel(RID, 'c'));
			expect(result.current).toBe(true);
		});

		it('v7+ t=c true when only create-team-channel granted', () => {
			mockUsePermissions.mockImplementation(grant(['create-team-channel']));
			const { result } = renderHook(() => useCanCreateTeamChannel(RID, 'c'));
			expect(result.current).toBe(true);
		});

		it('v7+ t=p true when only create-team-group granted', () => {
			mockUsePermissions.mockImplementation(grant(['create-team-group']));
			const { result } = renderHook(() => useCanCreateTeamChannel(RID, 'p'));
			expect(result.current).toBe(true);
		});

		it('v7+ t=c false when none of move-room-to-team/create-c/create-team-channel granted', () => {
			mockUsePermissions.mockImplementation(grant(['add-team-channel', 'create-p']));
			const { result } = renderHook(() => useCanCreateTeamChannel(RID, 'c'));
			expect(result.current).toBe(false);
		});

		it('pre-v7 t=c true when only addTeamChannel granted', () => {
			mockServerVersion = '6.0.0';
			mockUsePermissions.mockImplementation(grant(['add-team-channel']));
			const { result } = renderHook(() => useCanCreateTeamChannel(RID, 'c'));
			expect(result.current).toBe(true);
		});

		it('pre-v7 t=p true when only create-p granted', () => {
			mockServerVersion = '6.0.0';
			mockUsePermissions.mockImplementation(grant(['create-p']));
			const { result } = renderHook(() => useCanCreateTeamChannel(RID, 'p'));
			expect(result.current).toBe(true);
		});

		it('pre-v7 t=c false when only v7 perms granted', () => {
			mockServerVersion = '6.0.0';
			mockUsePermissions.mockImplementation(grant(['move-room-to-team', 'create-team-channel']));
			const { result } = renderHook(() => useCanCreateTeamChannel(RID, 'c'));
			expect(result.current).toBe(false);
		});
	});
});
