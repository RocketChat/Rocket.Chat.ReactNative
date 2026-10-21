import { needsActiveSpeaker } from '../needsActiveSpeaker';
import { type TPipShare, type TPipTile } from '../pickPipSource';
import { MAX_VISIBLE_TILES } from '../splitByPriority';

const me: TPipTile<string> = { id: 'me', name: 'me', isSelf: true, hasCamera: false };

const callOf = (people: number): TPipTile<string>[] => [
	me,
	...Array.from(
		{ length: people - 1 },
		(_, index): TPipTile<string> => ({
			id: `guest-${index}`,
			name: `guest-${index}`,
			isSelf: false,
			hasCamera: false
		})
	)
];

const remoteShare: TPipShare<string> = { id: 'ada', name: 'Ada', isLocal: false, trackRef: 'ada-screen' };

describe('needsActiveSpeaker', () => {
	it('is not needed for one other person in the grid', () => {
		expect(needsActiveSpeaker({ shares: [], tiles: callOf(2), gridLayout: true, expanded: true })).toBe(false);
	});

	it('is needed once the grid hides people behind the overflow tile', () => {
		expect(needsActiveSpeaker({ shares: [], tiles: callOf(MAX_VISIBLE_TILES + 1), gridLayout: true, expanded: false })).toBe(
			true
		);
	});

	it('is needed by the spotlight and sidebar layouts even for one other person', () => {
		expect(needsActiveSpeaker({ shares: [], tiles: callOf(2), gridLayout: false, expanded: true })).toBe(true);
	});

	it('is needed by the picture in picture window when two others could be shown', () => {
		expect(needsActiveSpeaker({ shares: [], tiles: callOf(3), gridLayout: true, expanded: true })).toBe(true);
	});

	it('is not needed for the picture in picture window while the call is minimized', () => {
		expect(needsActiveSpeaker({ shares: [], tiles: callOf(3), gridLayout: true, expanded: false })).toBe(false);
	});

	it('is not needed for the picture in picture window while someone else is presenting', () => {
		expect(needsActiveSpeaker({ shares: [remoteShare], tiles: callOf(3), gridLayout: true, expanded: true })).toBe(false);
	});
});
