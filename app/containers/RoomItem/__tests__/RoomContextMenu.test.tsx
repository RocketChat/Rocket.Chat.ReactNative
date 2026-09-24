import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import RoomContextMenu from '../RoomContextMenu.ios';
import { toggleFav } from '~/lib/methods/toggleFav';
import { SubscriptionType } from '~/definitions';

jest.mock('~/lib/methods/toggleFav', () => ({ toggleFav: jest.fn() }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: () => '7.0.0' }));

const renderMenu = (enabled: boolean) =>
	render(
		<RoomContextMenu
			enabled={enabled}
			rid='room-id'
			type={SubscriptionType.CHANNEL}
			name='general'
			lastMessage='hello'
			isRead={false}
			favorite={false}
			width={320}>
			<Text>row</Text>
		</RoomContextMenu>
	);

describe('RoomContextMenu', () => {
	it('toggles favorite from the menu', async () => {
		await renderMenu(true);
		screen.getByTestId('action-sheet-favorite').props.onButtonPress();
		expect(toggleFav).toHaveBeenCalledWith('room-id', false);
	});

	it('renders only the row when disabled', async () => {
		await renderMenu(false);
		expect(screen.getByText('row')).toBeTruthy();
		expect(screen.queryByTestId('action-sheet-favorite')).toBeNull();
	});
});
