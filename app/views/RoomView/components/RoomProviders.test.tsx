import { act, render } from '@testing-library/react-native';

import { RoomProviders } from './RoomProviders';
import { useComposerRid, useComposerSharing } from '../../../containers/MessageComposer/ComposerStore';
import {
	createMessageActionStore,
	useIsBeingEdited,
	useMessageAction
} from '../../../containers/message/stores/MessageActionStore';

describe('RoomProviders', () => {
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
		const rooms = [
			{ rid: 'rid-1', t: 'c' },
			{ rid: 'rid-2', t: 'c' }
		];
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
		const otherStore = createMessageActionStore();
		const rowActionSpy = jest.fn();
		const composerActionSpy = jest.fn();
		const otherActionSpy = jest.fn();
		const isBeingEditedSpy = jest.fn();
		const ridSpy = jest.fn();

		const RowProbe = () => {
			rowActionSpy(useMessageAction());
			return null;
		};
		const ComposerProbe = () => {
			composerActionSpy(useMessageAction());
			isBeingEditedSpy(useIsBeingEdited('msg-1'));
			ridSpy(useComposerRid());
			return null;
		};
		const OtherProbe = () => {
			otherActionSpy(useMessageAction());
			return null;
		};

		render(
			<>
				<RoomProviders store={store} rid='rid-1' t='c' room={{ rid: 'rid-1', t: 'c' }}>
					<>
						<RowProbe />
						<ComposerProbe />
					</>
				</RoomProviders>
				<RoomProviders store={otherStore} rid='rid-1' t='c' room={{ rid: 'rid-1', t: 'c' }}>
					<OtherProbe />
				</RoomProviders>
			</>
		);

		expect(ridSpy).toHaveBeenLastCalledWith('rid-1');
		expect(rowActionSpy).toHaveBeenLastCalledWith(null);
		expect(composerActionSpy).toHaveBeenLastCalledWith(null);
		expect(otherActionSpy).toHaveBeenLastCalledWith(null);
		expect(isBeingEditedSpy).toHaveBeenLastCalledWith(false);

		act(() => store.getState().actions.requestEditing('msg-1'));

		expect(rowActionSpy).toHaveBeenLastCalledWith({ kind: 'edit', messageId: 'msg-1' });
		expect(composerActionSpy).toHaveBeenLastCalledWith({ kind: 'edit', messageId: 'msg-1' });
		expect(otherActionSpy).toHaveBeenLastCalledWith(null);
		expect(isBeingEditedSpy).toHaveBeenLastCalledWith(true);
	});
});
