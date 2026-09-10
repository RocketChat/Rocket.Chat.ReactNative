import { MessageComposerContainer } from '../../../../containers/MessageComposer';
import { type IRoomFooterProps } from '../../definitions';
import { AirgappedWs } from './AirgappedWs';
import { OnHold } from './OnHold';
import { Preview } from './Preview';
import { TakeOrJoin } from './TakeOrJoin';
import { useRoomFooterState } from './useRoomFooterState';

export const RoomFooter = ({ messageComposerRef, joinCodeRef, ready }: IRoomFooterProps) => {
	const state = useRoomFooterState();

	if (!ready) {
		return null;
	}

	switch (state.kind) {
		case 'onHold':
			return <OnHold />;
		case 'takeOrJoin':
			return <TakeOrJoin joinCodeRef={joinCodeRef} />;
		case 'airgapped':
			return <AirgappedWs />;
		case 'preview':
			return <Preview message={state.message} />;
		case 'composer':
			return <MessageComposerContainer ref={messageComposerRef} />;
	}
};
