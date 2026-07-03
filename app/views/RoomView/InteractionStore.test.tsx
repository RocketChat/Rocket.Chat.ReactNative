import { render } from '@testing-library/react-native';

import { InteractionProvider, useIsBeingEdited, useMessageAction, useSelectedMessages } from './InteractionStore';

describe('InteractionStore', () => {
	describe('useIsBeingEdited', () => {
		it('returns false with no provider (module fallback store) and does not throw', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useIsBeingEdited('msg-1'));
				return null;
			};

			expect(() => render(<Probe />)).not.toThrow();
			expect(spy).toHaveBeenLastCalledWith(false);
		});

		it('returns true only for the message being edited under a provider', () => {
			const editedSpy = jest.fn();
			const otherSpy = jest.fn();
			const Probe = () => {
				editedSpy(useIsBeingEdited('msg-1'));
				otherSpy(useIsBeingEdited('msg-2'));
				return null;
			};

			render(
				<InteractionProvider initialState={{ action: 'edit', selectedMessages: ['msg-1'] }}>
					<Probe />
				</InteractionProvider>
			);

			expect(editedSpy).toHaveBeenLastCalledWith(true);
			expect(otherSpy).toHaveBeenLastCalledWith(false);
		});
	});

	describe('action hooks without a provider', () => {
		let consoleErrorSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		it('useMessageAction throws', () => {
			const Probe = () => {
				useMessageAction();
				return null;
			};
			expect(() => render(<Probe />)).toThrow('Interaction hooks must be used within an InteractionProvider');
		});

		it('useSelectedMessages throws', () => {
			const Probe = () => {
				useSelectedMessages();
				return null;
			};
			expect(() => render(<Probe />)).toThrow('Interaction hooks must be used within an InteractionProvider');
		});
	});
});
