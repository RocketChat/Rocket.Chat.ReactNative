import { act, render } from '@testing-library/react-native';
import { Subject } from 'rxjs';

import RoomItemContainer from '..';
import { isRead } from '~/lib/methods/helpers';

jest.mock('../RoomItem', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	return ({ name, isRead: read }: { name: string; isRead: boolean }) => (
		<MockText>{`${name}:${read ? 'read' : 'unread'}`}</MockText>
	);
});
jest.mock('../../ActionSheet', () => ({ useActionSheet: () => ({ showActionSheet: jest.fn() }) }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: () => '7.0.0' }));

const createRecord = () => {
	const changes = new Subject<void>();
	const record = {
		rid: 'rid',
		t: 'c',
		name: 'general',
		fname: 'general',
		open: true,
		archived: false,
		alert: true,
		unread: 3,
		tunread: [],
		observe: () => changes
	};
	return { record, changes };
};

const renderRow = (record: ReturnType<typeof createRecord>['record']) =>
	render(
		<RoomItemContainer
			item={record}
			onPress={jest.fn()}
			width={300}
			username='user'
			useRealName={false}
			showLastMessage
			showAvatar
			displayMode='expanded'
			getRoomTitle={room => room.fname}
			getRoomAvatar={() => ''}
			getIsRead={isRead}
			swipeEnabled
		/>
	);

describe('RoomItemContainer', () => {
	it('reflects in-place record updates after the record emits', () => {
		const { record, changes } = createRecord();
		const { getByText } = renderRow(record);
		expect(getByText('general:unread')).toBeTruthy();

		record.alert = false;
		record.unread = 0;
		record.fname = 'renamed';
		act(() => changes.next());

		expect(getByText('renamed:read')).toBeTruthy();
	});

	it('unsubscribes from the record on unmount', () => {
		const { record, changes } = createRecord();
		const { unmount } = renderRow(record);
		unmount();
		expect(changes.observed).toBe(false);
	});
});
