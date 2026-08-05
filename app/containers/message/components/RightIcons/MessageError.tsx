import MessageActionTouchable from '../Touchable/MessageActionTouchable';
import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { BUTTON_HIT_SLOP } from '../../utils';
import { useTheme } from '../../../../theme';
import { useMessageItem, useMessageStatus } from '../../stores/MessageStore';
import { useErrorActionsShow } from '../../stores/MessageRoomStore';

const MessageError = () => {
	const { colors } = useTheme();
	const item = useMessageItem();
	const errorActionsShow = useErrorActionsShow();
	const { hasError } = useMessageStatus();

	if (!hasError) {
		return null;
	}

	return (
		<MessageActionTouchable onPress={() => errorActionsShow?.(item)} style={styles.rightIcons} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='warning' color={colors.buttonBackgroundDangerDefault} size={16} />
		</MessageActionTouchable>
	);
};

export default MessageError;
