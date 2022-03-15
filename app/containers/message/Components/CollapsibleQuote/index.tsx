import { transparentize } from 'color2k';
import { dequal } from 'dequal';
import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themes } from '../../../../constants/colors';
import { IAttachment } from '../../../../definitions/IAttachment';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import { CustomIcon } from '../../../../lib/Icons';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import Markdown from '../../../markdown';
import MessageContext from '../../Context';
import Touchable from '../../Touchable';
import { BUTTON_HIT_SLOP } from '../../utils';

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 6,
		borderWidth: 1,
		borderRadius: 4,
		minHeight: 40
	},
	attachmentContainer: {
		flex: 1,
		borderRadius: 4,
		padding: 8
	},
	authorContainer: {
		flexDirection: 'row'
	},
	fieldContainer: {
		flexDirection: 'column',
		paddingLeft: 10,
		paddingTop: 10,
		paddingBottom: 10
	},
	fieldTitle: {
		fontSize: 15,
		...sharedStyles.textBold
	},
	marginTop: {
		marginTop: 4
	},
	marginBottom: {
		marginBottom: 4
	},
	title: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	touchableContainer: {
		flexDirection: 'row'
	},
	markdownFontSize: {
		fontSize: 15
	},
	iconContainer: {
		width: 20,
		height: 20,
		right: 8,
		top: 8,
		justifyContent: 'center',
		alignItems: 'center'
	}
});

interface IMessageFields {
	attachment: IAttachment;
	getCustomEmoji: TGetCustomEmoji;
}

interface IMessageReply {
	attachment: IAttachment;
	timeFormat?: string;
	index: number;
	getCustomEmoji: TGetCustomEmoji;
}

const Fields = React.memo(
	({ attachment, getCustomEmoji }: IMessageFields) => {
		if (!attachment.fields) {
			return null;
		}
		const { baseUrl, user } = useContext(MessageContext);
		const { theme } = useTheme();
		return (
			<>
				{attachment.fields.map(field => (
					<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
						<Text testID='collapsibleQuoteTouchableFieldTitle' style={[styles.fieldTitle, { color: themes[theme].bodyText }]}>
							{field.title}
						</Text>
						<Markdown
							msg={field?.value || ''}
							baseUrl={baseUrl}
							username={user.username}
							getCustomEmoji={getCustomEmoji}
							theme={theme}
							style={[styles.markdownFontSize]}
						/>
					</View>
				))}
			</>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.attachment.fields, nextProps.attachment.fields)
);

const CollapsibleQuote = React.memo(
	({ attachment, index, getCustomEmoji }: IMessageReply) => {
		if (!attachment) {
			return null;
		}
		const [collapsed, setCollapsed] = useState(attachment.collapsed);
		const { theme } = useTheme();

		const onPress = () => {
			setCollapsed(!collapsed);
		};

		let {
			borderColor,
			chatComponentBackground: backgroundColor,
			collapsibleQuoteBorder,
			collapsibleChevron,
			headerTintColor
		} = themes[theme];

		try {
			if (attachment.color) {
				backgroundColor = transparentize(attachment.color, 0.8);
				borderColor = attachment.color;
				collapsibleQuoteBorder = attachment.color;
				collapsibleChevron = attachment.color;
				headerTintColor = headerTintColor;
			}
		} catch (e) {
			// fallback to default
		}

		return (
			<>
				<Touchable
					testID={`collapsibleQuoteTouchable-${attachment.title}`}
					onPress={onPress}
					style={[
						styles.button,
						index > 0 && styles.marginTop,
						attachment.description && styles.marginBottom,
						{
							backgroundColor,
							borderLeftColor: collapsibleQuoteBorder,
							borderTopColor: borderColor,
							borderRightColor: borderColor,
							borderBottomColor: borderColor,
							borderLeftWidth: 2
						}
					]}
					background={Touchable.Ripple(themes[theme].bannerBackground)}
					hitSlop={BUTTON_HIT_SLOP}>
					<View style={styles.touchableContainer}>
						<View style={styles.attachmentContainer}>
							<View style={styles.authorContainer}>
								<Text style={[styles.title, { color: headerTintColor }]}>{attachment.title}</Text>
							</View>
							{!collapsed && <Fields attachment={attachment} getCustomEmoji={getCustomEmoji} />}
						</View>
						<View style={styles.iconContainer}>
							<CustomIcon name={!collapsed ? 'chevron-up' : 'chevron-down'} size={22} color={collapsibleChevron} />
						</View>
					</View>
				</Touchable>
			</>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.attachment, nextProps.attachment)
);

CollapsibleQuote.displayName = 'CollapsibleQuote';
Fields.displayName = 'CollapsibleQuoteFields';

export default CollapsibleQuote;
