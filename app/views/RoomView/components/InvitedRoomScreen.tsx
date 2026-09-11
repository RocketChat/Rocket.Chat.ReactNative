import { type IInviteSubscription } from '../../../definitions';
import SafeAreaView from '../../../containers/SafeAreaView';
import { useTheme } from '../../../theme';
import { InvitedRoom } from './InvitedRoom';

interface IInvitedRoomScreenProps {
	title: string;
	description: string;
	inviter: IInviteSubscription['inviter'];
	onAccept: () => Promise<void>;
	onReject: () => Promise<void>;
}

export const InvitedRoomScreen = ({ title, description, inviter, onAccept, onReject }: IInvitedRoomScreenProps) => {
	const { colors } = useTheme();

	return (
		<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='room-view-invited'>
			<InvitedRoom title={title} description={description} inviter={inviter} onAccept={onAccept} onReject={onReject} />
		</SafeAreaView>
	);
};
