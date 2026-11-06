import { NO_ACTIVE_SPEAKER, loudestSpeakerId, pickActiveSpeaker } from '../pickActiveSpeaker';

describe('loudestSpeakerId', () => {
	it('is null when nobody is above the speaking threshold', () => {
		expect(loudestSpeakerId([])).toBeNull();
		expect(loudestSpeakerId([{ id: 'ada', level: 0.2 }])).toBeNull();
	});

	it('picks the loudest of those above the threshold', () => {
		expect(
			loudestSpeakerId([
				{ id: 'ada', level: 0.3 },
				{ id: 'bob', level: 0.9 },
				{ id: 'eve', level: 0.1 }
			])
		).toBe('bob');
	});

	it('prefers the first listed of equally loud speakers', () => {
		expect(
			loudestSpeakerId([
				{ id: 'ada', level: 0.5 },
				{ id: 'bob', level: 0.5 }
			])
		).toBe('ada');
	});
});

describe('pickActiveSpeaker', () => {
	const quiet = [{ id: 'ada', level: 0 }];
	const loud = (id: string) => [{ id, level: 0.8 }];

	it('names nobody while nobody has spoken', () => {
		expect(pickActiveSpeaker(NO_ACTIVE_SPEAKER, quiet, 10000)).toBe(NO_ACTIVE_SPEAKER);
	});

	it('names the first person who speaks at once', () => {
		expect(pickActiveSpeaker(NO_ACTIVE_SPEAKER, loud('ada'), 10000)).toEqual({ id: 'ada', heardAt: 10000 });
	});

	it('refreshes the time the current speaker was last heard while they keep speaking', () => {
		expect(pickActiveSpeaker({ id: 'ada', heardAt: 10000 }, loud('ada'), 12000)).toEqual({ id: 'ada', heardAt: 12000 });
	});

	it('keeps the speaker through a pause of up to 1500ms', () => {
		const current = { id: 'ada', heardAt: 10000 };
		expect(pickActiveSpeaker(current, quiet, 11500)).toBe(current);
	});

	it('drops the speaker once the pause is longer than 1500ms', () => {
		expect(pickActiveSpeaker({ id: 'ada', heardAt: 10000 }, quiet, 11501)).toEqual(NO_ACTIVE_SPEAKER);
	});

	it('keeps the current speaker while someone else speaks within 1500ms', () => {
		const current = { id: 'ada', heardAt: 10000 };
		expect(pickActiveSpeaker(current, loud('bob'), 11500)).toBe(current);
	});

	it('switches to someone else once the current speaker has been quiet for longer than 1500ms', () => {
		expect(pickActiveSpeaker({ id: 'ada', heardAt: 10000 }, loud('bob'), 11501)).toEqual({ id: 'bob', heardAt: 11501 });
	});

	it('keeps the current speaker when they are still the loudest of several', () => {
		const levels = [
			{ id: 'ada', level: 0.9 },
			{ id: 'bob', level: 0.4 }
		];
		expect(pickActiveSpeaker({ id: 'ada', heardAt: 10000 }, levels, 20000)).toEqual({ id: 'ada', heardAt: 20000 });
	});
});
