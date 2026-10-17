import { needsActiveSpeakerForPip, pickPipSource, type TPipShare, type TPipTile } from '../pickPipSource';

const tile = (id: string, rest: Partial<TPipTile<string>> = {}): TPipTile<string> => ({
	id,
	name: id.toUpperCase(),
	isSelf: false,
	hasCamera: false,
	...rest
});

const share = (id: string, rest: Partial<TPipShare<string>> = {}): TPipShare<string> => ({
	id,
	name: id.toUpperCase(),
	isLocal: false,
	trackRef: `${id}-screen`,
	...rest
});

const me = tile('me', { isSelf: true, hasCamera: true, cameraTrack: 'me-camera' });

describe('pickPipSource', () => {
	it('shows what someone else is presenting before anything else', () => {
		const source = pickPipSource({
			shares: [share('ada')],
			tiles: [me, tile('bob', { hasCamera: true, cameraTrack: 'bob-camera' })],
			activeSpeakerId: 'bob'
		});

		expect(source).toEqual({ kind: 'screen', id: 'ada', name: 'ADA', track: 'ada-screen' });
	});

	it('does not show our own screen share, so we see the people we are presenting to', () => {
		const source = pickPipSource({
			shares: [share('me', { isLocal: true })],
			tiles: [me, tile('bob', { hasCamera: true, cameraTrack: 'bob-camera' })],
			activeSpeakerId: null
		});

		expect(source).toEqual({ kind: 'camera', id: 'bob', name: 'BOB', track: 'bob-camera' });
	});

	it('prefers the first of several shares from other people', () => {
		const source = pickPipSource({ shares: [share('ada'), share('bob')], tiles: [me], activeSpeakerId: null });

		expect(source).toMatchObject({ kind: 'screen', id: 'ada' });
	});

	it('shows whoever is speaking when nobody presents', () => {
		const source = pickPipSource({
			shares: [],
			tiles: [
				me,
				tile('ada', { hasCamera: true, cameraTrack: 'ada-camera' }),
				tile('bob', { hasCamera: true, cameraTrack: 'bob-camera' })
			],
			activeSpeakerId: 'bob'
		});

		expect(source).toEqual({ kind: 'camera', id: 'bob', name: 'BOB', track: 'bob-camera' });
	});

	it('shows the avatar of a speaker whose camera is off instead of someone else on camera', () => {
		const source = pickPipSource({
			shares: [],
			tiles: [me, tile('ada', { hasCamera: true, cameraTrack: 'ada-camera' }), tile('bob')],
			activeSpeakerId: 'bob'
		});

		expect(source).toEqual({ kind: 'avatar', id: 'bob', name: 'BOB' });
	});

	it('shows the first remote camera when nobody is speaking', () => {
		const source = pickPipSource({
			shares: [],
			tiles: [me, tile('ada'), tile('bob', { hasCamera: true, cameraTrack: 'bob-camera' })],
			activeSpeakerId: null
		});

		expect(source).toMatchObject({ kind: 'camera', id: 'bob' });
	});

	it('falls back to the first remote avatar when nobody has a camera', () => {
		const source = pickPipSource({ shares: [], tiles: [me, tile('ada'), tile('bob')], activeSpeakerId: null });

		expect(source).toEqual({ kind: 'avatar', id: 'ada', name: 'ADA' });
	});

	it('ignores a speaker who is no longer in the call', () => {
		const source = pickPipSource({ shares: [], tiles: [me, tile('ada')], activeSpeakerId: 'gone' });

		expect(source).toEqual({ kind: 'avatar', id: 'ada', name: 'ADA' });
	});

	it('shows ourselves when we are alone in the call', () => {
		const source = pickPipSource({ shares: [], tiles: [me], activeSpeakerId: null });

		expect(source).toEqual({ kind: 'camera', id: 'me', name: 'ME', track: 'me-camera' });
	});

	it('treats a camera flagged on without a track as an avatar', () => {
		const source = pickPipSource({ shares: [], tiles: [me, tile('ada', { hasCamera: true })], activeSpeakerId: 'ada' });

		expect(source).toEqual({ kind: 'avatar', id: 'ada', name: 'ADA' });
	});

	it('has nothing to show before anyone has joined', () => {
		expect(pickPipSource({ shares: [], tiles: [], activeSpeakerId: null })).toBeUndefined();
	});
});

describe('needsActiveSpeakerForPip', () => {
	it('is needed to choose between several people who are not presenting', () => {
		expect(needsActiveSpeakerForPip({ shares: [], tiles: [me, tile('ada'), tile('bob')] })).toBe(true);
	});

	it('is not needed with one other person, who is shown whoever speaks', () => {
		expect(needsActiveSpeakerForPip({ shares: [], tiles: [me, tile('ada')] })).toBe(false);
	});

	it('is not needed while someone else presents, since that is shown instead', () => {
		expect(needsActiveSpeakerForPip({ shares: [share('ada')], tiles: [me, tile('ada'), tile('bob')] })).toBe(false);
	});

	it('is still needed when only our own screen is shared', () => {
		expect(needsActiveSpeakerForPip({ shares: [share('me', { isLocal: true })], tiles: [me, tile('ada'), tile('bob')] })).toBe(
			true
		);
	});
});
