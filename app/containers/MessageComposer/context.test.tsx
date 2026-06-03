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

// These are characterization tests for the composer state container. They pin the full contract that the
// current split-context implementation provides and that the Zustand migration must preserve unchanged, but
// which the behavior-level suite in MessageComposer.test.tsx does not cover:
//   1. Per-slice re-render granularity — changing one slice must not re-render consumers of another.
//   2. Per-instance isolation — each MessageComposerProvider owns independent state (no shared store).
//   3. Set→read for every public slice, including the attachment setters (add/update/remove/clear).
//   4. A stable `api` reference — selectors that return a fresh actions object trip Zustand v5's
//      "snapshot changed" re-render loop, so the api the swap exposes must stay referentially stable.
// Every pin imports the public surface only (the hooks + provider). The store factory is intentionally NOT
// exported for testing, so these stay true characterization tests: green on the current code AND green,
// unchanged, after the swap. Each probe records renders through a jest.fn spy (calling a spy during render is
// pure from React's point of view; mutating an outer counter is not).

// Renders one probe per entry in `probes` (name -> subscription hook) plus an api probe. Adding a slice to a
// test = add an entry here. Returns the (stable) api, a per-probe render counter, and a per-probe value reader.
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

// The six scalar slices, each driven through set→read and granularity by the same loop. Adding a scalar slice
// later = add a row. `attachments` is the list slice and gets its own block below.
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

		// The reverse direction (a scalar change must not re-render an attachments consumer) is already covered
		// for every scalar by the granularity row in the SCALAR_SLICES table, which uses attachments as its
		// control. This pins the direction the table can't: a list mutation must not re-render scalar consumers.
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

			// The probe subscribes to BOTH a changing slice and the api, so per-slice granularity can't keep it
			// from re-rendering and let this pass for the wrong reason — it genuinely re-renders, and the api ref
			// must still be identical before and after.
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
