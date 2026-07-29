import { act, renderHook } from '@testing-library/react-native';

import { useFile } from '../useFile';
import { type IAttachment } from '../../../../definitions';

const file = { title: 'original.png', title_link: '/original' } as IAttachment;

describe('useFile', () => {
	it('returns the file prop untouched until something is merged', () => {
		const { result } = renderHook(() => useFile(file));

		expect(result.current[0]).toBe(file);
	});

	it('merges an override on top of the file prop', () => {
		const { result } = renderHook(() => useFile(file));

		act(() => result.current[1]({ title_link: 'file:///local/original.png' }));

		expect(result.current[0]).not.toBe(file);
		expect(result.current[0].title_link).toBe('file:///local/original.png');
		expect(result.current[0].title).toBe('original.png');
	});

	it('accumulates successive overrides', () => {
		const { result } = renderHook(() => useFile(file));

		act(() => result.current[1]({ title_link: 'file:///local/original.png' }));
		act(() => result.current[1]({ e2e: 'done' }));

		expect(result.current[0].title_link).toBe('file:///local/original.png');
		expect(result.current[0].e2e).toBe('done');
	});

	// The override is what the download resolved to locally, so it has to win over a later `file`
	// prop that still carries the remote url — that stale prop is exactly the bug this hook fixes.
	it('keeps overrides applied when the file prop changes', () => {
		const { result, rerender } = renderHook(({ f }: { f: IAttachment }) => useFile(f), {
			initialProps: { f: file }
		});

		act(() => result.current[1]({ title_link: 'file:///local/original.png' }));
		rerender({ f: { ...file, title: 'renamed.png' } as IAttachment });

		expect(result.current[0].title).toBe('renamed.png');
		expect(result.current[0].title_link).toBe('file:///local/original.png');
	});
});
