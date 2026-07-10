import { act, render } from '@testing-library/react-native';

import { RoomProviders } from './RoomProviders';
import { useComposerRid, useComposerSharing } from './stores/ComposerStore';
import { createMessageActionStore, useIsBeingEdited, useMessageAction } from '../../containers/message/stores/MessageActionStore';

describe('RoomProviders', () => {
	it('exposes the provided composer values to consumers via named hooks', () => {
		const store = createMessageActionStore();
		const room = { rid: 'rid-1' };
		const ridSpy = jest.fn();

		const Probe = () => {
			ridSpy(useComposerRid());
			return null;
		};

		render(
			<RoomProviders store={store} rid='rid-1' t='c' room={room}>
				<Probe />
			</RoomProviders>
		);

		expect(ridSpy).toHaveBeenLastCalledWith('rid-1');
	});

	it('does not re-render a consumer selecting a different slice when an unselected prop changes', () => {
		const store = createMessageActionStore();
		const sharingRenderSpy = jest.fn();

		const SharingProbe = () => {
			sharingRenderSpy(useComposerSharing());
			return null;
		};

		// Kept as a single stable element reference so React can bail out of re-rendering it
		// when only a sibling slice (room) changes — recreating it per render would force a
		// re-render regardless of zustand's selector isolation, defeating the point of this test.
		const children = <SharingProbe />;
		const rooms = [{ rid: 'rid-1' }, { rid: 'rid-2' }];
		const Parent = ({ roomIndex }: { roomIndex: number }) => (
			<RoomProviders store={store} rid='rid-1' t='c' room={rooms[roomIndex]} sharing={false}>
				{children}
			</RoomProviders>
		);

		const { rerender } = render(<Parent roomIndex={0} />);
		rerender(<Parent roomIndex={1} />);

		expect(sharingRenderSpy).toHaveBeenCalledTimes(1);
	});

	it('resolves useMessageAction/useIsBeingEdited to the store passed in props, not some other store', () => {
		const store = createMessageActionStore();
		const actionSpy = jest.fn();
		const isBeingEditedSpy = jest.fn();

		const Probe = () => {
			actionSpy(useMessageAction());
			isBeingEditedSpy(useIsBeingEdited('msg-1'));
			return null;
		};

		render(
			<RoomProviders store={store} rid='rid-1' t='c' room={{ rid: 'rid-1' }}>
				<Probe />
			</RoomProviders>
		);

		expect(actionSpy).toHaveBeenLastCalledWith(null);
		expect(isBeingEditedSpy).toHaveBeenLastCalledWith(false);

		act(() => store.getState().actions.startEditing('msg-1'));

		expect(actionSpy).toHaveBeenLastCalledWith({ kind: 'edit', messageId: 'msg-1' });
		expect(isBeingEditedSpy).toHaveBeenLastCalledWith(true);
	});
});
