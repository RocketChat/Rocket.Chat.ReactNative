import { downloadStatusReducer, type TDownloadEvent } from '../useMediaAutoDownload';
import { type TDownloadState } from '../../../../lib/methods/handleMediaDownload';

describe('downloadStatusReducer', () => {
	const cases: Array<[TDownloadState, TDownloadEvent, TDownloadState]> = [
		['to-download', 'download_started', 'loading'],
		['loading', 'download_succeeded', 'downloaded'],
		['to-download', 'download_succeeded', 'downloaded'],
		['to-download', 'cache_hit', 'downloaded'],
		['loading', 'cache_hit', 'downloaded'],
		['loading', 'download_failed', 'to-download'],
		['loading', 'download_canceled', 'to-download'],
		['downloaded', 'download_started', 'loading']
	];

	it.each(cases)('from %s on %s moves to %s', (from, event, to) => {
		expect(downloadStatusReducer(from, event)).toBe(to);
	});

	it('ignores unknown events and keeps the current state', () => {
		expect(downloadStatusReducer('to-download', 'unknown_event' as TDownloadEvent)).toBe('to-download');
	});
});
