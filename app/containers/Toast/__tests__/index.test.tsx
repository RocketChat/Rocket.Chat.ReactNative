import { Alert } from 'react-native';
import { act, render } from '@testing-library/react-native';

import Toast from '..';
import { showToast } from '~/lib/methods/helpers/showToast';
import { type TAlertDisplayType } from '~/views/AccessibilityAndAppearanceView';

const mockToastHosts: { show: jest.Mock }[] = [];

jest.mock('react-native-easy-toast', () => {
	const { Component } = require('react');
	return class MockEasyToast extends Component {
		show = jest.fn();

		constructor(props: object) {
			super(props);
			mockToastHosts.push(this);
		}

		render() {
			return null;
		}
	};
});

let mockAlertDisplayType: TAlertDisplayType = 'TOAST';

jest.mock('~/lib/methods/userPreferences', () => ({
	useUserPreferences: () => [mockAlertDisplayType, jest.fn()]
}));

const Screen = ({ withPrompt }: { withPrompt: boolean }) => (
	<>
		<Toast />
		{withPrompt ? <Toast /> : null}
	</>
);

const emitToast = () => act(() => showToast('Copied to clipboard'));

describe('Toast', () => {
	beforeEach(() => {
		mockToastHosts.length = 0;
		mockAlertDisplayType = 'TOAST';
	});

	it('shows the toast once, on the prompt, while the prompt is open', () => {
		render(<Screen withPrompt />);
		const [rootHost, promptHost] = mockToastHosts;

		emitToast();

		expect(promptHost.show).toHaveBeenCalledTimes(1);
		expect(promptHost.show).toHaveBeenCalledWith('Copied to clipboard', expect.any(Number));
		expect(rootHost.show).not.toHaveBeenCalled();
	});

	it('shows the toast on the root after the prompt closes', () => {
		const { rerender } = render(<Screen withPrompt />);
		const [rootHost, promptHost] = mockToastHosts;

		rerender(<Screen withPrompt={false} />);
		emitToast();

		expect(rootHost.show).toHaveBeenCalledTimes(1);
		expect(rootHost.show).toHaveBeenCalledWith('Copied to clipboard', expect.any(Number));
		expect(promptHost.show).not.toHaveBeenCalled();
	});

	it('keeps showing toasts on the root across several prompts', () => {
		const { rerender } = render(<Screen withPrompt={false} />);
		const [rootHost] = mockToastHosts;

		rerender(<Screen withPrompt />);
		rerender(<Screen withPrompt={false} />);
		rerender(<Screen withPrompt />);
		rerender(<Screen withPrompt={false} />);
		emitToast();

		expect(rootHost.show).toHaveBeenCalledTimes(1);
	});

	it('shows a single dialog when the alert display is a dialog and the prompt is open', () => {
		mockAlertDisplayType = 'DIALOG';
		const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
		render(<Screen withPrompt />);

		emitToast();

		expect(alertSpy).toHaveBeenCalledTimes(1);
		expect(alertSpy).toHaveBeenCalledWith('Copied to clipboard');
		expect(mockToastHosts.every(host => host.show.mock.calls.length === 0)).toBe(true);
		alertSpy.mockRestore();
	});
});
