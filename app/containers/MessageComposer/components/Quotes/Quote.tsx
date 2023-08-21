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
	const { colors } = useTheme();
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
		<View
			style={{
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
			}}
			testID={`composer-quote-${message.id}`}
		>
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
					<Text
						style={{
							...sharedStyles.textBold,
							color: colors.fontTitlesLabels,
							fontSize: 14,
							lineHeight: 20,
							flexShrink: 1,
							paddingRight: 4
						}}
						numberOfLines={1}
					>
						{username}
					</Text>
					<Text
						style={{
							...sharedStyles.textRegular,
							color: colors.fontAnnotation,
							fontSize: 12,
							lineHeight: 16
						}}
					>
						{time}
					</Text>
				</View>
				<BaseButton
					icon='close'
					color={colors.fontDefault}
					onPress={() => onRemoveQuoteMessage(message.id)}
					accessibilityLabel='Remove_quote_message'
					testID={`composer-quote-remove-${message.id}`}
				/>
			</View>
			<MarkdownPreview
				style={[
					{
						...sharedStyles.textRegular,
						// @ts-ignore
						color: colors.fontDefault,
						fontSize: 14,
						lineHeight: 20
					}
				]}
				numberOfLines={1}
				msg={msg}
			/>
		</View>
	);
};
