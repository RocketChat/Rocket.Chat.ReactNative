import { type ReactElement } from 'react';

import { useTheme } from '../../../theme';
import Button from '../../../containers/Button';
import I18n from '../../../i18n';
import type { IInviteSubscription } from '../../../definitions';
import Chip from '../../../containers/Chip';
import { RoomPlaceholder } from './RoomPlaceholder';

type InvitedRoomProps = {
	title: string;
	description: string;
	inviter: IInviteSubscription['inviter'];
	onAccept: () => Promise<void>;
	onReject: () => Promise<void>;
};

export const InvitedRoom = ({ title, description, inviter, onAccept, onReject }: InvitedRoomProps): ReactElement => {
	const { colors } = useTheme();

	return (
		<RoomPlaceholder
			icon='mail'
			title={title}
			description={description}
			detail={<Chip avatar={inviter.username} text={inviter.name || inviter.username} fullWidth />}>
			<Button title={I18n.t('accept')} onPress={onAccept} />
			<Button title={I18n.t('reject')} type='secondary' backgroundColor={colors.surfaceTint} onPress={onReject} />
		</RoomPlaceholder>
	);
};
