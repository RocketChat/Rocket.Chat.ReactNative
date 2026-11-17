import { StyleSheet } from 'react-native';
import { type ReactTestInstance } from 'react-test-renderer';
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

	it('keeps a fixed height and one title line unless the row asks for more', () => {
		const cardStyle = () => {
			let node: ReactTestInstance | null = screen.getByTestId('long-reply');
			while (node && !StyleSheet.flatten(node.props.style)?.backgroundColor) node = node.parent;
			return StyleSheet.flatten(node?.props.style);
		};
		const { rerender } = render(<NativeListRow title='Long reply' accessibilityLabel='Long reply' testID='long-reply' />);
		expect(screen.getByText('Long reply').props.numberOfLines).toBe(1);
		expect(cardStyle()).toMatchObject({ height: 54 });
		expect(cardStyle().minHeight).toBeUndefined();

		rerender(<NativeListRow title='Long reply' accessibilityLabel='Long reply' testID='long-reply' titleNumberOfLines={0} />);
		expect(screen.getByText('Long reply').props.numberOfLines).toBe(0);
		expect(cardStyle()).toMatchObject({ minHeight: 54, paddingVertical: 6 });
		expect(cardStyle().height).toBeUndefined();
	});
});
