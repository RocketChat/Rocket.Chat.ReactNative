import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useTheme } from '../../../../theme';
import { useMessageField } from '../../MessageStore';
import { useIsReadReceiptEnabled } from '../../MessageRoomStore';

const ReadReceipt = () => {
	'use memo';

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
ReadReceipt.displayName = 'MessageReadReceipt';

export default ReadReceipt;
