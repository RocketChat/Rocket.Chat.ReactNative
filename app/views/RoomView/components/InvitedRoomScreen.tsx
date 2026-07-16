import { type IInviteSubscription } from '../../../definitions';
import SafeAreaView from '../../../containers/SafeAreaView';
import { useTheme } from '../../../theme';
import { getInvitationData } from '../../../lib/methods/getInvitationData';
import { InvitedRoom } from './InvitedRoom';

export const InvitedRoomScreen = ({ room }: { room: IInviteSubscription }) => {
	'use memo';

	const { colors } = useTheme();
	const { title, description, inviter, accept, reject } = getInvitationData(room);

	return (
		<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='room-view-invited'>
			<InvitedRoom title={title} description={description} inviter={inviter} onAccept={accept} onReject={reject} />
		</SafeAreaView>
	);
};
