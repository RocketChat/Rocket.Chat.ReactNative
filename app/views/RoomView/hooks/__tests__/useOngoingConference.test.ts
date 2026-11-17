import { act, renderHook, waitFor } from '@testing-library/react-native';

import { VideoConferenceStatus } from '~/definitions/IVideoConference';
import { emitter } from '~/lib/methods/helpers/emitter';
import sdk from '~/lib/services/sdk';
import { useOngoingConference } from '../useOngoingConference';

jest.mock('@react-navigation/native', () => {
	const { useEffect } = jest.requireActual('react');
	return { useFocusEffect: useEffect };
});

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: { get: jest.fn() }
}));

const mockGet = sdk.get as jest.Mock;

const call = (
	id: string,
	status: VideoConferenceStatus,
	endedAt?: string,
	{ rid = 'rid-1', discussionRid }: { rid?: string; discussionRid?: string } = {}
) => ({ _id: id, rid, discussionRid, status, endedAt });
const respond = (data: unknown[]) => mockGet.mockResolvedValue({ success: true, data });

describe('useOngoingConference', () => {
	beforeEach(() => {
		mockGet.mockReset();
	});

	it('lists the conferences of the room', async () => {
		respond([]);

		renderHook(() => useOngoingConference('rid-1'));

		await waitFor(() => expect(mockGet).toHaveBeenCalledWith('video-conference.list', { roomId: 'rid-1', count: 10 }));
	});

	it('returns the first started conference that has not ended', async () => {
		respond([
			call('ended', VideoConferenceStatus.ENDED, '2026-11-16T10:00:00.000Z'),
			call('stale', VideoConferenceStatus.STARTED, '2026-11-16T10:00:00.000Z'),
			call('ringing', VideoConferenceStatus.CALLING),
			call('ongoing', VideoConferenceStatus.STARTED)
		]);

		const { result } = renderHook(() => useOngoingConference('rid-1'));

		await waitFor(() => expect(result.current).toBe('ongoing'));
	});

	it('returns a conference whose discussion is the room', async () => {
		respond([call('moved', VideoConferenceStatus.STARTED, undefined, { rid: 'parent-dm', discussionRid: 'rid-1' })]);

		const { result } = renderHook(() => useOngoingConference('rid-1'));

		await waitFor(() => expect(result.current).toBe('moved'));
	});

	it('returns a conference started in the room that moved to a discussion', async () => {
		respond([call('started-here', VideoConferenceStatus.STARTED, undefined, { discussionRid: 'discussion-1' })]);

		const { result } = renderHook(() => useOngoingConference('rid-1'));

		await waitFor(() => expect(result.current).toBe('started-here'));
	});

	it('ignores a conference that belongs to neither the room nor its discussion', async () => {
		respond([call('elsewhere', VideoConferenceStatus.STARTED, undefined, { rid: 'other', discussionRid: 'other-discussion' })]);

		const { result } = renderHook(() => useOngoingConference('rid-1'));

		await waitFor(() => expect(mockGet).toHaveBeenCalled());
		await act(() => Promise.resolve());
		expect(result.current).toBeUndefined();
	});

	it('returns nothing when no conference is running', async () => {
		respond([call('ended', VideoConferenceStatus.ENDED, '2026-11-16T10:00:00.000Z')]);

		const { result } = renderHook(() => useOngoingConference('rid-1'));

		await waitFor(() => expect(mockGet).toHaveBeenCalled());
		expect(result.current).toBeUndefined();
	});

	it('refreshes when a conference is updated', async () => {
		respond([]);
		const { result } = renderHook(() => useOngoingConference('rid-1'));
		await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

		respond([call('ongoing', VideoConferenceStatus.STARTED)]);
		act(() => emitter.emit('videoConfUpdated', 'ongoing'));

		await waitFor(() => expect(result.current).toBe('ongoing'));
	});

	it('clears the call once it ends', async () => {
		respond([call('ongoing', VideoConferenceStatus.STARTED)]);
		const { result } = renderHook(() => useOngoingConference('rid-1'));
		await waitFor(() => expect(result.current).toBe('ongoing'));

		respond([call('ongoing', VideoConferenceStatus.ENDED, '2026-11-16T10:00:00.000Z')]);
		act(() => emitter.emit('videoConfUpdated', 'ongoing'));

		await waitFor(() => expect(result.current).toBeUndefined());
	});

	it('keeps the last known call when the request fails', async () => {
		respond([call('ongoing', VideoConferenceStatus.STARTED)]);
		const { result } = renderHook(() => useOngoingConference('rid-1'));
		await waitFor(() => expect(result.current).toBe('ongoing'));

		const failed = mockGet.mockClear().mockRejectedValue(new Error('offline'));
		act(() => emitter.emit('videoConfUpdated', 'ongoing'));

		await waitFor(() => expect(failed).toHaveBeenCalled());
		await act(() => Promise.resolve());
		expect(result.current).toBe('ongoing');
	});

	it('stops listening once unmounted', async () => {
		respond([]);
		const { unmount } = renderHook(() => useOngoingConference('rid-1'));
		await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

		unmount();
		emitter.emit('videoConfUpdated', 'ongoing');

		expect(mockGet).toHaveBeenCalledTimes(1);
	});
});
