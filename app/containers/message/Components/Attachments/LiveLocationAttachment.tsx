import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { useTheme } from '../../../../theme';
import type { IAttachment } from '../../../../definitions';
import Navigation from '../../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { reopenLiveLocationModal, isLiveLocationActive } from '../../../../views/LocationShare/LiveLocationPreviewModal';
import I18n from '../../../../i18n';

interface ILiveLocationAttachment {
	attachment: IAttachment;
	messageId?: string;
	roomId?: string;
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 8,
		padding: 12,
		marginVertical: 4,
		borderLeftWidth: 4
	},
	disabledContainer: {
		opacity: 0.6
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8
	},
	icon: {
		fontSize: 20,
		marginRight: 8
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1
	},
	status: {
		fontSize: 12,
		fontWeight: '500'
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	action: {
		fontSize: 14,
		fontWeight: '500'
	},
	disabledAction: {
		fontWeight: '400'
	}
});

const LiveLocationAttachment: React.FC<ILiveLocationAttachment> = ({ attachment, messageId, roomId }) => {
	const { colors } = useTheme();
	const currentUserId = useAppSelector(state => state.login.user.id);
	const isActive = !!attachment.live?.isActive;

	const { live } = attachment;

	if (!live) {
		return null;
	}

	const handlePress = () => {
		if (!messageId || !roomId) {
			return;
		}

		const isOwner = currentUserId === live?.ownerId;

		if (isOwner) {
			reopenLiveLocationModal();
		} else {
			if (isLiveLocationActive()) {
				Alert.alert(I18n.t('Cannot_View_Live_Location'), I18n.t('Cannot_View_Live_Location_Message'), [{ text: I18n.t('OK') }]);
				return;
			}

			Navigation.navigate('LiveLocationViewerModal', {
				rid: roomId,
				msgId: messageId
			});
		}
	};

	return (
		<TouchableOpacity
			style={[
				styles.container,
				{
					backgroundColor: isActive ? colors.surfaceNeutral : colors.surfaceDisabled,
					borderLeftColor: isActive ? colors.statusFontSuccess : colors.statusFontDanger
				},
				!isActive && styles.disabledContainer
			]}
			onPress={isActive ? handlePress : undefined}
			disabled={!isActive}>
			<View style={styles.header}>
				<Text style={styles.icon}>📍</Text>
				<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('Live_Location')}</Text>
				<Text style={[styles.status, { color: isActive ? colors.statusFontSuccess : colors.statusFontDanger }]}>
					{isActive ? `🔴 ${I18n.t('Active')}` : `⚫ ${I18n.t('Ended')}`}
				</Text>
			</View>

			<View style={styles.footer}>
				<Text
					style={[
						styles.action,
						{ color: colors.fontTitlesLabels },
						!isActive && { color: colors.fontSecondaryInfo },
						!isActive && styles.disabledAction
					]}>
					{isActive ? I18n.t('Tap_to_view_live_location') : I18n.t('Location_sharing_ended')}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

export default LiveLocationAttachment;
