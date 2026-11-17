import { render, screen } from '@testing-library/react-native';

import NativeListRow from '..';

jest.mock('~/lib/hooks/useResponsiveLayout/useResponsiveLayout', () => ({ useResponsiveLayout: () => ({ fontScale: 1 }) }));

const renderRow = ({ disabled }: { disabled: boolean }) =>
	render(
		<NativeListRow
			title='Invite users'
			accessibilityLabel='Invite users'
			onPress={jest.fn()}
			testID='invite-users'
			disabled={disabled}
			disabledReason='Room has attribute-based access'
		/>
	);

describe('NativeListRow', () => {
	it('announces the disabled reason as a hint after the title', () => {
		renderRow({ disabled: true });

		const row = screen.getByRole('button', { name: 'Invite users' });
		expect(row.props.accessibilityHint).toBe('Room has attribute-based access');
	});

	it('omits the hint while the row is enabled', () => {
		renderRow({ disabled: false });

		expect(screen.getByRole('button', { name: 'Invite users' }).props.accessibilityHint).toBeUndefined();
	});
});
