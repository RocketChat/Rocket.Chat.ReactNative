import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { useTheme } from '../../../../theme';
import { IAttachment } from '../../../../definitions';
import Navigation from '../../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { reopenLiveLocationModal, isLiveLocationActive } from '../../../../views/LocationShare/LiveLocationPreviewModal';

interface ILiveLocationAttachment {
	attachment: IAttachment & {
		live?: {
			isActive: boolean;
			ownerId: string;
			coords?: { lat: number; lng: number; acc?: number };
			startedAt: Date;
			lastUpdateAt: Date;
			expiresAt?: Date;
		};
	};
	getCustomEmoji: Function;
	showAttachment?: Function;
	style?: any;
	isReply?: boolean;
	author?: any;
	messageId?: string;
	roomId?: string;
}

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
					'Cannot View Live Location',
					'You cannot view others\' live locations while sharing your own. Please stop sharing your location first.',
					[{ text: 'OK' }]
				);
				return;
			}
			
			Navigation.navigate('LiveLocationViewerModal', {
				rid: roomId,
				msgId: messageId
			});
		}
	};

	const styles = StyleSheet.create({
		container: {
			backgroundColor: colors.surfaceNeutral,
			borderRadius: 8,
			padding: 12,
			marginVertical: 4,
			borderLeftWidth: 4,
			borderLeftColor: live.isActive ? '#27ae60' : '#e74c3c'
		},
		disabledContainer: {
			opacity: 0.6,
			backgroundColor: colors.surfaceDisabled || colors.surfaceNeutral
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
			color: live.isActive ? '#27ae60' : '#e74c3c'
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

	return (
		<TouchableOpacity 
			style={[styles.container, !live.isActive && styles.disabledContainer]} 
			onPress={live.isActive ? handlePress : undefined}
			disabled={!live.isActive}
		>
			<View style={styles.header}>
				<Text style={styles.icon}>📍</Text>
				<Text style={styles.title}>Live Location</Text>
				<Text style={styles.status}>
					{live.isActive ? '🔴 Active' : '⚫ Ended'}
				</Text>
			</View>
			
			<View style={styles.footer}>
				<Text style={[styles.action, !live.isActive && styles.disabledAction]}>
					{live.isActive ? 'Tap to view live location' : 'Location sharing ended'}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

export default LiveLocationAttachment;