import React from 'react';
import { act, render } from '@testing-library/react-native';

import { type IShareAttachment } from '../../definitions';
import {
	MessageComposerProvider,
	useAlsoSendThreadToChannel,
	useAutocompleteParams,
	useComposerAttachments,
	useFocused,
	useMessageComposerApi,
	useMicOrSend,
	useRecordingAudio,
	useShowMarkdownToolbar
} from './context';

type Api = ReturnType<typeof useMessageComposerApi>;

// Tests for the composer store's public hook/provider contract and its per-slice re-render granularity.
// Non-obvious constraint: the `actions` bag must stay a stable reference — a selector returning a fresh object
// each render trips zustand v5's snapshot-equality loop. Renders are counted with jest.fn spies, not an outer
// counter (a spy call in render is pure; mutation isn't).

// One probe per `probes` entry (name -> hook) plus an api probe; returns the stable api and per-probe render/value readers.
const renderComposer = (probes: Record<string, () => unknown>) => {
	const probeSpies: Record<string, jest.Mock> = {};
	const apiSpy = jest.fn();

	const probeElements = Object.entries(probes).map(([name, useHook]) => {
		const spy = jest.fn();
		probeSpies[name] = spy;
		const Probe = () => {
			spy(useHook());
			return null;
		};
		return <Probe key={name} />;
	});

	const ApiProbe = () => {
		apiSpy(useMessageComposerApi());
		return null;
	};

	render(
		<MessageComposerProvider>
			<>
				{probeElements}
				<ApiProbe />
			</>
		</MessageComposerProvider>
	);

	const renderCount = (name: string) => probeSpies[name].mock.calls.length;
	const latestValue = (name: string) => {
		const { calls } = probeSpies[name].mock;
		return calls[calls.length - 1]?.[0];
	};

	// api is stable, so the first render's value is the one every test calls setters on.
	const [[api]] = apiSpy.mock.calls as [Api][];
	return { api, renderCount, latestValue };
};

const attachment = (path: string, extra?: Partial<IShareAttachment>): IShareAttachment => ({
	filename: `${path}.png`,
	size: 1,
	path,
	...extra
});

// One row per scalar slice; each runs the same set→read + granularity tests. (attachments is a list slice, tested below.)
type ScalarCase = {
	name: string;
	useHook: () => unknown;
	initial: unknown;
	mutate: (api: Api) => void;
	next: unknown;
};

const SCALAR_SLICES: ScalarCase[] = [
	{ name: 'focused', useHook: useFocused, initial: false, mutate: api => api.setFocused(true), next: true },
	{ name: 'micOrSend', useHook: useMicOrSend, initial: 'mic', mutate: api => api.setMicOrSend('send'), next: 'send' },
	{
		name: 'showMarkdownToolbar',
		useHook: useShowMarkdownToolbar,
		initial: false,
		mutate: api => api.setMarkdownToolbar(true),
		next: true
	},
	{
		name: 'alsoSendThreadToChannel',
		useHook: useAlsoSendThreadToChannel,
		initial: false,
		mutate: api => api.setAlsoSendThreadToChannel(true),
		next: true
	},
	{ name: 'recordingAudio', useHook: useRecordingAudio, initial: false, mutate: api => api.setRecordingAudio(true), next: true },
	{
		name: 'autocompleteParams',
		useHook: useAutocompleteParams,
		initial: { text: '', type: null },
		mutate: api => api.setAutocompleteParams({ text: '@ro', type: '@' }),
		next: { text: '@ro', type: '@' }
	}
];

describe('MessageComposer state container', () => {
	describe('per-instance isolation', () => {
		it('keeps state independent across provider instances', () => {
			const spyA = jest.fn();
			const spyB = jest.fn();

			const Probe = ({ spy }: { spy: jest.Mock }) => {
				spy({ focused: useFocused(), api: useMessageComposerApi() });
				return null;
			};

			render(
				<>
					<MessageComposerProvider>
						<Probe spy={spyA} />
					</MessageComposerProvider>
					<MessageComposerProvider>
						<Probe spy={spyB} />
					</MessageComposerProvider>
				</>
			);

			const latest = (spy: jest.Mock): { focused: boolean; api: Api } => spy.mock.calls[spy.mock.calls.length - 1][0];

			expect(latest(spyA).focused).toBe(false);
			expect(latest(spyB).focused).toBe(false);

			// Mutating one instance must not leak into the other
			act(() => latest(spyA).api.setFocused(true));

			expect(latest(spyA).focused).toBe(true);
			expect(latest(spyB).focused).toBe(false);

			// And the reverse direction stays isolated too
			act(() => latest(spyB).api.setRecordingAudio(true));

			expect(latest(spyA).focused).toBe(true);
		});
	});

	describe('scalar slices', () => {
		describe.each(SCALAR_SLICES)('$name', ({ name, useHook, initial, mutate, next }) => {
			it('exposes the initial value, then reflects the update (set→read)', () => {
				const { api, latestValue } = renderComposer({ [name]: useHook });

				expect(latestValue(name)).toEqual(initial);

				act(() => mutate(api));

				expect(latestValue(name)).toEqual(next);
			});

			it('re-renders its own consumer but not an unrelated one when it changes (granularity)', () => {
				// attachments is the control slice — it is never the scalar under test
				const { api, renderCount } = renderComposer({ [name]: useHook, attachments: useComposerAttachments });

				const sliceBaseline = renderCount(name);
				const controlBaseline = renderCount('attachments');

				act(() => mutate(api));

				expect(renderCount(name)).toBeGreaterThan(sliceBaseline);
				expect(renderCount('attachments')).toBe(controlBaseline);
			});
		});
	});

	describe('attachments', () => {
		it('add appends attachments in order', () => {
			const { api, latestValue } = renderComposer({ attachments: useComposerAttachments });

			expect(latestValue('attachments')).toEqual([]);

			act(() => api.addAttachments([attachment('a')]));
			act(() => api.addAttachments([attachment('b')]));

			expect((latestValue('attachments') as IShareAttachment[]).map(a => a.path)).toEqual(['a', 'b']);
		});

		it('update merges a patch into the matching attachment by path, leaving others untouched', () => {
			const { api, latestValue } = renderComposer({ attachments: useComposerAttachments });

			act(() => api.addAttachments([attachment('a'), attachment('b')]));
			act(() => api.updateAttachment('a', { description: 'hello' }));

			const result = latestValue('attachments') as IShareAttachment[];
			expect(result.find(a => a.path === 'a')).toMatchObject({ path: 'a', filename: 'a.png', description: 'hello' });
			expect(result.find(a => a.path === 'b')?.description).toBeUndefined();
		});

		it('remove filters out the attachment with the matching path', () => {
			const { api, latestValue } = renderComposer({ attachments: useComposerAttachments });

			act(() => api.addAttachments([attachment('a'), attachment('b')]));
			act(() => api.removeAttachment('a'));

			expect((latestValue('attachments') as IShareAttachment[]).map(a => a.path)).toEqual(['b']);
		});

		it('clear empties the attachments', () => {
			const { api, latestValue } = renderComposer({ attachments: useComposerAttachments });

			act(() => api.addAttachments([attachment('a'), attachment('b')]));
			act(() => api.clearAttachments());

			expect(latestValue('attachments')).toEqual([]);
		});

		// Reverse of the table's granularity check: a list mutation must not re-render scalar consumers.
		it('does not re-render a scalar consumer when attachments change', () => {
			const { api, renderCount } = renderComposer({ attachments: useComposerAttachments, focused: useFocused });

			const attachmentsBaseline = renderCount('attachments');
			const focusedBaseline = renderCount('focused');

			act(() => api.addAttachments([attachment('a')]));

			expect(renderCount('attachments')).toBeGreaterThan(attachmentsBaseline);
			expect(renderCount('focused')).toBe(focusedBaseline);
		});
	});

	describe('actions reference stability', () => {
		it('keeps the same api reference across slice updates', () => {
			const probe = jest.fn();

			// Subscribes to a changing slice AND the api, so the re-render is real — the api ref must still be identical.
			const Probe = () => {
				useFocused();
				probe(useMessageComposerApi());
				return null;
			};

			render(
				<MessageComposerProvider>
					<Probe />
				</MessageComposerProvider>
			);

			const callsBefore = probe.mock.calls.length;
			const ref1: Api = probe.mock.calls[callsBefore - 1][0];

			act(() => ref1.setFocused(true));

			expect(probe.mock.calls.length).toBeGreaterThan(callsBefore);
			const ref2: Api = probe.mock.calls[probe.mock.calls.length - 1][0];
			expect(ref2).toBe(ref1);
		});
	});
});
