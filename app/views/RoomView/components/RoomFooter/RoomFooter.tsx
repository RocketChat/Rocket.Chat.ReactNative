import { MessageComposerContainer } from '../../../../containers/MessageComposer';
import { type IRoomFooterProps } from '../../definitions';
import { AirgappedWs } from './AirgappedWs';
import { OnHold } from './OnHold';
import { Preview } from './Preview';
import { TakeOrJoin } from './TakeOrJoin';
import { useRoomFooterState } from './useRoomFooterState';

export const RoomFooter = ({ messageComposerRef, joinCodeRef, loading }: IRoomFooterProps) => {
	const state = useRoomFooterState();

	switch (state.kind) {
		case 'onHold':
			return <OnHold loading={loading} />;
		case 'takeOrJoin':
			return <TakeOrJoin joinCodeRef={joinCodeRef} loading={loading} />;
		case 'airgapped':
			return <AirgappedWs />;
		case 'preview':
			return <Preview message={state.message} />;
		case 'composer':
			return <MessageComposerContainer ref={messageComposerRef} />;
	}
};
