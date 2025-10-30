import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type TColors } from '../../../../theme';
import type { IAttachment } from '../../../../definitions';
import type { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import Navigation from '../../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { reopenLiveLocationModal, isLiveLocationActive } from '../../../../views/LocationShare/LiveLocationPreviewModal';
import I18n from '../../../../i18n';

interface ILiveLocationAttachment {
	attachment: IAttachment;
	getCustomEmoji: TGetCustomEmoji;
	showAttachment?: (attachment: IAttachment) => void;
	style?: StyleProp<ViewStyle>;
	isReply?: boolean;
	author?: {
		_id: string;
		username?: string;
		name?: string;
	};
	messageId?: string;
	roomId?: string;
}

/* eslint-disable react-native/no-unused-styles */
const createStyles = (colors: TColors, isActive: boolean) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.surfaceNeutral,
			borderRadius: 8,
			padding: 12,
			marginVertical: 4,
			borderLeftWidth: 4,
			borderLeftColor: isActive ? colors.statusFontSuccess : colors.statusFontDanger
		},
		disabledContainer: {
			opacity: 0.6,
			backgroundColor: colors.surfaceDisabled
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
			color: colors.fontTitlesLabels,
			flex: 1
		},
		status: {
			fontSize: 12,
			fontWeight: '500',
			color: isActive ? colors.statusFontSuccess : colors.statusFontDanger
		},
		footer: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center'
		},
		action: {
			fontSize: 14,
			color: colors.fontTitlesLabels,
			fontWeight: '500'
		},
		disabledAction: {
			color: colors.fontSecondaryInfo,
			fontWeight: '400'
		}
	});

const LiveLocationAttachment: React.FC<ILiveLocationAttachment> = ({
	attachment,
	getCustomEmoji: _getCustomEmoji,
	showAttachment: _showAttachment,
	style: _style,
	isReply: _isReply,
	author: _author,
	messageId,
	roomId
}) => {

	const { colors } = useTheme();
	const currentUserId = useAppSelector(state => state.login.user.id);
	const styles = React.useMemo(() => createStyles(colors, !!attachment.live?.isActive), [colors, attachment.live?.isActive]);

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
				Alert.alert(
					I18n.t('Cannot_View_Live_Location'),
					I18n.t('Cannot_View_Live_Location_Message'),
					[{ text: I18n.t('OK') }]
				);
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
			style={[styles.container, !live.isActive && styles.disabledContainer]} 
			onPress={live.isActive ? handlePress : undefined}
			disabled={!live.isActive}
		>
			<View style={styles.header}>
				<Text style={styles.icon}>📍</Text>
				<Text style={styles.title}>{I18n.t('Live_Location')}</Text>
				<Text style={styles.status}>
					{live.isActive ? `🔴 ${I18n.t('Active')}` : `⚫ ${I18n.t('Ended')}`}
				</Text>
			</View>
			
			<View style={styles.footer}>
				<Text style={[styles.action, !live.isActive && styles.disabledAction]}>
					{live.isActive ? I18n.t('Tap_to_view_live_location') : I18n.t('Location_sharing_ended')}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

export default LiveLocationAttachment;