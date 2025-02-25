import { transparentize } from 'color2k';
import { dequal } from 'dequal';
import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themes } from '../../../../../lib/constants';
import { IAttachment } from '../../../../../definitions/IAttachment';
import { TGetCustomEmoji } from '../../../../../definitions/IEmoji';
import { CustomIcon } from '../../../../CustomIcon';
import { useTheme } from '../../../../../theme';
import sharedStyles from '../../../../../views/Styles';
import Markdown from '../../../../markdown';
import MessageContext from '../../../Context';
import Touchable from '../../../Touchable';
import { BUTTON_HIT_SLOP } from '../../../utils';

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
	fieldText: {
		fontSize: 15,
		padding: 10,
		...sharedStyles.textRegular
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

interface IMessageAttText {
	text?: string;
	getCustomEmoji: TGetCustomEmoji;
}

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

const AttText = React.memo(
	({ text, getCustomEmoji }: IMessageAttText) => {
		const { user } = useContext(MessageContext);

		if (!text) {
			return null;
		}

		return <Markdown msg={text} username={user.username} getCustomEmoji={getCustomEmoji} style={[styles.fieldText]} />;
	},
	(prevProps, nextProps) => prevProps.text === nextProps.text
);

const Fields = React.memo(
	({ attachment, getCustomEmoji }: IMessageFields) => {
		const { theme } = useTheme();
		const { user } = useContext(MessageContext);

		if (!attachment.fields) {
			return null;
		}

		return (
			<>
				{attachment.fields.map(field => (
					<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
						<Text testID='collapsibleQuoteTouchableFieldTitle' style={[styles.fieldTitle, { color: themes[theme].fontDefault }]}>
							{field.title}
						</Text>
						<Markdown
							msg={field?.value || ''}
							username={user.username}
							getCustomEmoji={getCustomEmoji}
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
		const { theme } = useTheme();
		const [collapsed, setCollapsed] = useState(attachment?.collapsed);

		if (!attachment) {
			return null;
		}

		const onPress = () => {
			setCollapsed(!collapsed);
		};

		let { strokeExtraLight, surfaceTint: backgroundColor, strokeLight, strokeMedium, fontSecondaryInfo } = themes[theme];

		try {
			if (attachment.color) {
				backgroundColor = transparentize(attachment.color, 0.8);
				strokeExtraLight = attachment.color;
				strokeLight = attachment.color;
				strokeMedium = attachment.color;
				fontSecondaryInfo = fontSecondaryInfo;
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
							borderLeftColor: strokeLight,
							borderTopColor: strokeExtraLight,
							borderRightColor: strokeExtraLight,
							borderBottomColor: strokeExtraLight,
							borderLeftWidth: 2
						}
					]}
					background={Touchable.Ripple(themes[theme].surfaceNeutral)}
					hitSlop={BUTTON_HIT_SLOP}>
					<View style={styles.touchableContainer}>
						<View style={styles.attachmentContainer}>
							<View style={styles.authorContainer}>
								<Text style={[styles.title, { color: fontSecondaryInfo }]}>{attachment.title}</Text>
							</View>
							{!collapsed && <AttText text={attachment.text} getCustomEmoji={getCustomEmoji} />}
							{!collapsed && <Fields attachment={attachment} getCustomEmoji={getCustomEmoji} />}
						</View>
						<View style={styles.iconContainer}>
							<CustomIcon name={!collapsed ? 'chevron-up' : 'chevron-down'} size={22} color={strokeMedium} />
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
