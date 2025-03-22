import React from 'react';
import { View, Text } from 'react-native';
import moment from 'moment';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { useRoomContext } from '../../../../views/RoomView/context';
import { BaseButton } from '../Buttons';
import { useMessage } from '../../hooks';
import { useAppSelector } from '../../../../lib/hooks';
import { MarkdownPreview } from '../../../markdown';

export const Quote = ({ messageId }: { messageId: string }) => {
	const [styles, colors] = useStyle();
	const message = useMessage(messageId);
	const useRealName = useAppSelector(({ settings }) => settings.UI_Use_Real_Name);
	const { onRemoveQuoteMessage } = useRoomContext();

	let username = '';
	let msg = '';
	let time = '';

	if (message) {
		username = useRealName ? message.u?.name || message.u?.username || '' : message.u?.username || '';
		msg = message.msg || '';
		time = message.ts ? moment(message.ts).format('LT') : '';
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
			<MarkdownPreview style={[styles.message]} numberOfLines={1} msg={msg} />
		</View>
	);
};

function useStyle() {
	const { colors } = useTheme();
	const style = {
		root: {
			backgroundColor: colors.surfaceTint,
			height: 64,
			width: 320,
			borderColor: colors.strokeExtraLight,
			borderLeftColor: colors.strokeMedium,
			borderWidth: 1,
			borderTopRightRadius: 4,
			borderBottomRightRadius: 4,
			paddingLeft: 16,
			padding: 8,
			marginRight: 8
		},
		header: { flexDirection: 'row', alignItems: 'center' },
		title: { flexDirection: 'row', flex: 1, alignItems: 'center' },
		username: {
			...sharedStyles.textBold,
			color: colors.fontTitlesLabels,
			fontSize: 14,
			lineHeight: 20,
			flexShrink: 1,
			paddingRight: 4
		},
		time: {
			...sharedStyles.textRegular,
			color: colors.fontAnnotation,
			fontSize: 12,
			lineHeight: 16
		},
		message: {
			...sharedStyles.textRegular,
			color: colors.fontDefault,
			fontSize: 14,
			lineHeight: 20
		}
	} as const;
	return [style, colors] as const;
}
