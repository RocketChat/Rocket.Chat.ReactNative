import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import moment from 'moment';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { useRoomContext } from '../../../../views/RoomView/context';
import { BaseButton } from '../Buttons';
import { useMessage } from '../../hooks';
import { useAppSelector } from '../../../../lib/hooks';

export const Quote = ({ messageId }: { messageId: string }) => {
	const [styles, colors] = useStyle();
	const message = useMessage(messageId);
	const useRealName = useAppSelector(({ settings }) => settings.UI_Use_Real_Name);
	const { onRemoveQuoteMessage } = useRoomContext();

	let username = '';
	let msg = '';
	let time = '';
	let imgcnt = 0;
	let audiocnt = 0;
	let videocnt = 0;
	let otherfilescnt = 0;

	if (message) {
		username = useRealName ? message.u?.name || message.u?.username || '' : message.u?.username || '';
		msg = message.msg || (message.attachments? message.attachments[0]?.description : '') || '';
		time = message.ts ? moment(message.ts).format('LT') : '';
		imgcnt = message?.attachments?.filter((attachment) => attachment.image_type).length || 0;
		audiocnt = message?.attachments?.filter((attachment) => attachment.audio_type).length || 0;
		videocnt = message?.attachments?.filter((attachment) => attachment.video_type).length || 0;
		otherfilescnt = message?.attachments?.length? message.attachments.length - imgcnt - audiocnt - videocnt : 0;
	}

	if (!message) {
		return null;
	}

	return (
		<View style={styles.root} testID={`composer-quote-${message.id}`}>
			<View style={styles.header}>
				<View style={styles.title}>
					<Text style={styles.username} numberOfLines={1}>
						{username}
					</Text>
					<Text style={styles.time}>{time}</Text>
				</View>

				<BaseButton
					icon='close'
					color={colors.fontDefault}
					onPress={() => onRemoveQuoteMessage?.(message.id)}
					accessibilityLabel='Remove_quote_message'
					testID={`composer-quote-remove-${message.id}`}
				/>
			</View>
			<View style={styles.messageWrapper}>
				<ScrollView 
					style={styles.messageContainer}
					contentContainerStyle={styles.messageContentContainer}
					showsVerticalScrollIndicator={true}
				>
					<Text style={styles.message} numberOfLines={2}>{msg}</Text>
				</ScrollView>
			</View>
			<View style={styles.attachmentBox}>
				{imgcnt > 0 && <Text style={styles.attachmentText}>📷 {imgcnt}</Text>}
				{audiocnt > 0 && <Text style={styles.attachmentText}>🔊 {audiocnt}</Text>}
				{videocnt > 0 && <Text style={styles.attachmentText}>🎥 {videocnt}</Text>}
				{otherfilescnt > 0 && <Text style={styles.attachmentText}>📎 {otherfilescnt}</Text>}
			</View>
		</View>
	);
};

function useStyle() {
	const { colors } = useTheme();
	const style = {
		root: {
			backgroundColor: colors.surfaceTint || '#1C1C1C',
			minHeight: 89,
			maxHeight: 120,
			width: 320,
			borderColor: colors.strokeExtraLight || '#2F2F2F',
			borderLeftColor: colors.strokeMedium || '#404040',
			borderWidth: 1,
			borderTopRightRadius: 4,
			borderBottomRightRadius: 4,
			paddingLeft: 16,
			padding: 8,
			marginRight: 8,
			flexDirection: 'column',
			justifyContent: 'space-between'
		},
		header: { 
			flexDirection: 'row', 
			alignItems: 'center',
			marginBottom: 4,
			minHeight: 24
		},
		title: { 
			flexDirection: 'row', 
			flex: 1, 
			alignItems: 'center' 
		},
		username: {
			...sharedStyles.textBold,
			color: colors.fontTitlesLabels || '#FFFFFF',
			fontSize: 14,
			lineHeight: 20,
			flexShrink: 1,
			paddingRight: 4
		},
		time: {
			...sharedStyles.textRegular,
			color: colors.fontAnnotation || '#9EA2A8',
			fontSize: 12,
			lineHeight: 16
		},
		messageWrapper: {
			flex: 1,
			minHeight: 20,
			marginVertical: 4
		},
		messageContainer: {
			flex: 1
		},
		messageContentContainer: {
			flexGrow: 1
		},
		message: {
			...sharedStyles.textRegular,
			color: colors.fontDefault || '#FFFFFF',
			fontSize: 14,
			lineHeight: 20
		},
		attachmentBox: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			gap: 8,
			minHeight: 20
		},
		attachmentText: {
			...sharedStyles.textRegular,
			color: colors.fontDefault || '#FFFFFF',
			fontSize: 12,
			lineHeight: 16
		}
	} as const;
	return [style, colors] as const;
}