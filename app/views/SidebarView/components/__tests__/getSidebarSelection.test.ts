import { getSidebarSelection } from '../getSidebarSelection';
import { type IStackItem } from '../useStackItems';

const item = (testID: string, selected: boolean, route?: string): IStackItem => ({
	title: testID,
	icon: 'message',
	testID,
	onPress: jest.fn(),
	selected,
	route
});

const stackItems = [
	item('sidebar-chats', false, 'ChatsStackNavigator'),
	item('sidebar-media-call', false),
	item('sidebar-profile', true, 'ProfileStackNavigator')
];

describe('getSidebarSelection', () => {
	it('selects the stack item of the current route ', () => {
		expect(getSidebarSelection(stackItems, null, 'ProfileStackNavigator')).toEqual({ selectedTag: 'sidebar-profile' });
	});

	it('selects admin when the current route is the admin route', () => {
		const items = stackItems.map(stackItem => ({ ...stackItem, selected: false }));
		expect(getSidebarSelection(items, 'AdminPanelStackNavigator', 'AdminPanelStackNavigator')).toEqual({
			selectedTag: 'sidebar-admin'
		});
	});

	it('never selects a row without a route', () => {
		const items = [item('sidebar-media-call', true)];
		expect(getSidebarSelection(items, null, null).selectedTag).toBeNull();
	});

	it('selects nothing when the current route has no row', () => {
		const items = stackItems.map(stackItem => ({ ...stackItem, selected: false }));
		expect(getSidebarSelection(items, null, 'Other').selectedTag).toBeNull();
	});
});
