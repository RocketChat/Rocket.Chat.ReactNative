import Touchable from '../../Touchable';
import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { BUTTON_HIT_SLOP } from '../../utils';
import { themes } from '../../../../lib/constants/colors';
import { useTheme } from '../../../../theme';
import { useMessageCtx, useMessageStatus } from '../../MessageStore';
import { useErrorActionsShow } from '../../MessageRoomStore';

const MessageError = () => {
	'use memo';

	const { theme } = useTheme();
	const { item } = useMessageCtx();
	const errorActionsShow = useErrorActionsShow();
	const { hasError } = useMessageStatus();

	if (!hasError) {
		return null;
	}

	return (
		<Touchable onPress={() => errorActionsShow?.(item)} style={styles.rightIcons} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='warning' color={themes[theme].buttonBackgroundDangerDefault} size={16} />
		</Touchable>
	);
};

MessageError.displayName = 'MessageError';

export default MessageError;
