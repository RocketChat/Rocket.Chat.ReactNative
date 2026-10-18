import { Pressable } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import NativeListRow, { NativeListRowContent } from '..';

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

describe('NativeListRowContent with an interactive trailing control', () => {
	const renderContent = ({ onPress }: { onPress?: () => void }) =>
		render(
			<NativeListRowContent
				title='Autoplay GIFs'
				accessibilityLabel='Autoplay GIFs'
				onPress={onPress}
				isTrailingInteractive
				trailing={<Pressable testID='control' />}
			/>
		);

	it('hides the control from assistive tech while the row is pressable', () => {
		renderContent({ onPress: jest.fn() });

		expect(screen.queryByTestId('control')).toBeNull();
	});

	it('keeps the control reachable by assistive tech when the row is not pressable', () => {
		renderContent({});

		expect(screen.getByTestId('control')).toBeTruthy();
	});
});
