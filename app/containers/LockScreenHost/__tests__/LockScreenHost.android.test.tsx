import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { LockScreenHost } from '../ModalLockScreenHost';

const mockModal: { onModalShow?: () => void; onModalHide?: () => void } = {};
jest.mock(
	'react-native-modal',
	() =>
		({ onModalShow, onModalHide, children }: { onModalShow: () => void; onModalHide: () => void; children: React.ReactNode }) => {
			mockModal.onModalShow = onModalShow;
			mockModal.onModalHide = onModalHide;
			return children;
		}
);

const renderHost = (visible: boolean, requestId: number, onShown: () => void) => (
	<LockScreenHost visible={visible} requestId={requestId} onShown={onShown} onHidden={jest.fn()}>
		<Text>lock screen</Text>
	</LockScreenHost>
);

describe('LockScreenHost on Android', () => {
	it('reports the lock screen shown only once it has faded in', () => {
		const onShown = jest.fn();
		render(renderHost(true, 1, onShown));
		expect(onShown).not.toHaveBeenCalled();

		act(() => mockModal.onModalShow?.());

		expect(onShown).toHaveBeenCalledTimes(1);
	});

	it('reports the lock screen shown at once when a new request replaces one that has faded in', () => {
		const onShown = jest.fn();
		const { rerender } = render(renderHost(true, 1, onShown));
		act(() => mockModal.onModalShow?.());

		rerender(renderHost(true, 2, onShown));

		expect(onShown).toHaveBeenCalledTimes(2);
	});

	it('waits for the fade-in again when a new request arrives after the lock screen started hiding', () => {
		const onShown = jest.fn();
		const { rerender } = render(renderHost(true, 1, onShown));
		act(() => mockModal.onModalShow?.());
		rerender(renderHost(false, 1, onShown));

		rerender(renderHost(true, 2, onShown));

		expect(onShown).toHaveBeenCalledTimes(1);
	});
});
