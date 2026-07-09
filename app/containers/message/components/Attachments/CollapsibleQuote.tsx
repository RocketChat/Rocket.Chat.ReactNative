import { transparentize } from 'color2k';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type IAttachment } from '../../../../definitions/IAttachment';
import { CustomIcon } from '../../../CustomIcon';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import Markdown from '../../../markdown';
import { useMessageUser } from '../../stores/MessageRoomStore';
import MessageActionTouchable from '../MessageActionTouchable';
import { BUTTON_HIT_SLOP } from '../../utils';

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
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
		paddingVertical: 10
	},
	fieldTitle: {
		fontSize: 15,
		...sharedStyles.textBold
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
}

interface IMessageFields {
	attachment: IAttachment;
}

interface IMessageReply {
	attachment: IAttachment;
}

const AttText = ({ text }: IMessageAttText) => {
	'use memo';

	const user = useMessageUser();

	if (!text) {
		return null;
	}

	return <Markdown msg={text} username={user?.username} />;
};

const Fields = ({ attachment }: IMessageFields) => {
	'use memo';

	const { colors } = useTheme();
	const user = useMessageUser();

	if (!attachment.fields) {
		return null;
	}

	return (
		<>
			{attachment.fields.map(field => (
				<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
					<Text testID='collapsibleQuoteTouchableFieldTitle' style={[styles.fieldTitle, { color: colors.fontDefault }]}>
						{field.title}
					</Text>
					<Markdown msg={field?.value || ''} username={user?.username} />
				</View>
			))}
		</>
	);
};

const CollapsibleQuote = ({ attachment }: IMessageReply) => {
	'use memo';

	const { colors } = useTheme();
	const [collapsed, setCollapsed] = useState(attachment?.collapsed);

	if (!attachment) {
		return null;
	}

	const onPress = () => {
		setCollapsed(!collapsed);
	};

	let { strokeExtraLight, surfaceTint: backgroundColor, strokeLight, strokeMedium } = colors;

	try {
		if (attachment.color) {
			backgroundColor = transparentize(attachment.color, 0.8);
			strokeExtraLight = attachment.color;
			strokeLight = attachment.color;
			strokeMedium = attachment.color;
		}
	} catch (e) {
		// fallback to default
	}

	return (
		<>
			<MessageActionTouchable
				testID={`collapsibleQuoteTouchable-${attachment.title}`}
				onPress={onPress}
				style={[
					styles.button,
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
				hitSlop={BUTTON_HIT_SLOP}>
				<View style={styles.touchableContainer}>
					<View style={styles.attachmentContainer}>
						<View style={styles.authorContainer}>
							<Text style={[styles.title, { color: colors.fontSecondaryInfo }]}>{attachment.title}</Text>
						</View>
						{!collapsed && <AttText text={attachment.text} />}
						{!collapsed && <Fields attachment={attachment} />}
					</View>
					<View style={styles.iconContainer}>
						<CustomIcon name={!collapsed ? 'chevron-up' : 'chevron-down'} size={22} color={strokeMedium} />
					</View>
				</View>
			</MessageActionTouchable>
		</>
	);
};

export default CollapsibleQuote;
