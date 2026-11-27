import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { LockScreenHost } from '../index.ios';

const renderHost = (visible: boolean, onShown: () => void, onHidden: () => void) => (
	<LockScreenHost visible={visible} onShown={onShown} onHidden={onHidden}>
		<Text>lock screen</Text>
	</LockScreenHost>
);

describe('LockScreenHost on iOS', () => {
	it('reports the lock screen shown once it is visible', () => {
		const onShown = jest.fn();
		const onHidden = jest.fn();

		render(renderHost(true, onShown, onHidden));

		expect(screen.getByText('lock screen')).toBeOnTheScreen();
		expect(onShown).toHaveBeenCalledTimes(1);
		expect(onHidden).not.toHaveBeenCalled();
	});

	it('reports the lock screen hidden when it goes away, and not before it was ever shown', () => {
		const onShown = jest.fn();
		const onHidden = jest.fn();
		const { rerender } = render(renderHost(false, onShown, onHidden));
		expect(onHidden).not.toHaveBeenCalled();

		rerender(renderHost(true, onShown, onHidden));
		rerender(renderHost(false, onShown, onHidden));

		expect(screen.queryByText('lock screen')).toBeNull();
		expect(onHidden).toHaveBeenCalledTimes(1);
	});
});
