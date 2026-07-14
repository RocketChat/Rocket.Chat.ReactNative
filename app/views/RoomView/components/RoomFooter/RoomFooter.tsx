import { MessageComposerContainer } from '../../../../containers/MessageComposer';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { type IRoomFooterProps } from '../../definitions';
import { useRoomStore, useRoomWithUpdate } from '../../stores/RoomStoreContext';
import { AirgappedWs } from './AirgappedWs';
import { OnHold } from './OnHold';
import { Preview } from './Preview';
import { TakeOrJoin } from './TakeOrJoin';
import { useFooterMessage } from './useFooterMessage';

export const RoomFooter = ({ messageComposerRef }: IRoomFooterProps) => {
	'use memo';

	const room = useRoomWithUpdate();
	const joined = useRoomStore(s => s.joined);
	const airGappedRestrictionRemainingDays = useAppSelector(
		state => state.settings.Cloud_Workspace_AirGapped_Restrictions_Remaining_Days as number | undefined
	);
	const footerMessage = useFooterMessage();

	if ('onHold' in room && room.onHold) {
		return <OnHold />;
	}
	if (!joined) {
		return <TakeOrJoin />;
	}
	if (airGappedRestrictionRemainingDays === 0) {
		return <AirgappedWs />;
	}
	if (footerMessage) {
		return <Preview message={footerMessage} />;
	}
	return <MessageComposerContainer ref={messageComposerRef} />;
};
