import React, { useState, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import { CustomIcon } from '../../../containers/CustomIcon';
import Button from '../../../containers/Button';
import sharedStyles from '../../Styles';
import I18n from '../../../i18n';
import type { IInviteSubscription } from '../../../definitions';
import Chip from '../../../containers/Chip';
import { getRoomTitle } from '../../../lib/methods/helpers';
import { replyRoomInvite } from '../../../lib/methods/replyRoomInvite';

const GAP = 32;

type InvitedRoomProps = {
	room: IInviteSubscription;
};

export const InvitedRoom = ({ room }: InvitedRoomProps): ReactElement => {
	const { colors } = useTheme();
	const styles = useStyle();
	const [loading, setLoading] = useState(false);

	const { rid, inviter } = room;
	const roomName = getRoomTitle(room);

	const title =
		room.t === 'd' ? I18n.t('invited_room_title_dm') : I18n.t('invited_room_title_channel', { room_name: roomName.slice(0, 30) });

	const description = room.t === 'd' ? I18n.t('invited_room_description_dm') : I18n.t('invited_room_description_channel');

	const handleReply = async (action: 'accept' | 'reject') => {
		try {
			setLoading(true);
			await replyRoomInvite(rid, action);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.root} testID='room-view-invite-room'>
			<View style={styles.container}>
				<View style={styles.textView}>
					<View style={styles.icon}>
						<CustomIcon name='mail' size={42} color={colors.fontSecondaryInfo} />
					</View>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.description}>{description}</Text>
					<Text style={styles.username}>
						<Chip avatar={inviter.username} text={inviter.name || inviter.username} />
					</Text>
				</View>
				<Button title={I18n.t('accept')} loading={loading} onPress={() => handleReply('accept')} />
				<Button
					title={I18n.t('reject')}
					type='secondary'
					loading={loading}
					backgroundColor={colors.surfaceTint}
					onPress={() => handleReply('reject')}
				/>
			</View>
		</View>
	);
};

const useStyle = () => {
	const { colors } = useTheme();
	const styles = StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: colors.surfaceRoom
		},
		container: {
			flex: 1,
			marginHorizontal: 24,
			justifyContent: 'center'
		},
		textView: { alignItems: 'center' },
		icon: {
			width: 58,
			height: 58,
			borderRadius: 30,
			marginBottom: GAP,
			backgroundColor: colors.surfaceNeutral,
			alignItems: 'center',
			justifyContent: 'center'
		},
		title: {
			...sharedStyles.textBold,
			fontSize: 24,
			lineHeight: 32,
			textAlign: 'center',
			color: colors.fontTitlesLabels,
			marginBottom: GAP
		},
		description: {
			...sharedStyles.textRegular,
			fontSize: 16,
			lineHeight: 24,
			textAlign: 'center',
			color: colors.fontDefault
		},
		username: {
			...sharedStyles.textRegular,
			fontSize: 16,
			lineHeight: 24,
			textAlign: 'center',
			color: colors.fontDefault,
			marginBottom: GAP
		}
	});
	return styles;
};
