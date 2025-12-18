import React, { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import { CustomIcon } from '../../../containers/CustomIcon';
import Button from '../../../containers/Button';
import sharedStyles from '../../Styles';
import I18n from '../../../i18n';
import type { IInviteSubscription } from '../../../definitions';
import Chip from '../../../containers/Chip';

const GAP = 32;

type InvitedRoomProps = {
	title: string;
	description: string;
	inviter: IInviteSubscription['inviter'];
	loading?: boolean;
	onAccept: () => Promise<void>;
	onReject: () => Promise<void>;
};

export const InvitedRoom = ({ title, description, inviter, loading, onAccept, onReject }: InvitedRoomProps): ReactElement => {
	const { colors } = useTheme();
	const styles = useStyle();

	return (
		<View style={styles.root}>
			<View style={styles.container}>
				<View style={styles.textView}>
					<View style={styles.icon}>
						<CustomIcon name='mail' size={42} color={colors.fontSecondaryInfo} />
					</View>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.description}>{description}</Text>
					<View style={styles.username}>
						<Chip avatar={inviter.username} text={inviter.name || inviter.username} />
					</View>
				</View>
				<Button title={I18n.t('accept')} loading={loading} onPress={onAccept} />
				<Button
					title={I18n.t('reject')}
					type='secondary'
					loading={loading}
					backgroundColor={colors.surfaceTint}
					onPress={onReject}
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
