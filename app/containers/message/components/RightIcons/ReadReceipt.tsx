import { CustomIcon } from '~/containers/CustomIcon';
import styles from '~/containers/message/styles';
import { useTheme } from '~/theme';
import { useMessageField } from '~/containers/message/stores/MessageStore';
import { useIsReadReceiptEnabled } from '~/containers/message/stores/MessageRoomStore';

const ReadReceipt = () => {
	const { colors } = useTheme();
	const unread = useMessageField(item => item.unread);
	const isReadReceiptEnabled = useIsReadReceiptEnabled();
	const isUnread = unread || unread === null;
	const iconName = isUnread ? 'check-single' : 'check-double';
	const iconColor = isUnread ? colors.fontAnnotation : colors.fontInfo;
	const marginTop = -5;

	if (isReadReceiptEnabled) {
		return (
			<CustomIcon
				name={iconName}
				color={iconColor}
				size={25}
				style={{ ...styles.rightIcons, marginTop }}
				testID={isUnread ? 'read-receipt-unread' : 'read-receipt-read'}
			/>
		);
	}
	return null;
};

export default ReadReceipt;
