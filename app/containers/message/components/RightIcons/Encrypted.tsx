import MessageActionTouchable from '../Touchable/MessageActionTouchable';
import { CustomIcon } from '../../../CustomIcon';
import { BUTTON_HIT_SLOP } from '../../utils';
import styles from '../../styles';
import { E2E_MESSAGE_TYPE } from '../../../../lib/constants/keys';
import { useMessageField } from '../../stores/MessageStore';
import { useOnEncryptedPress } from '../../stores/MessageRoomStore';

const Encrypted = () => {
	const onEncryptedPress = useOnEncryptedPress();
	const type = useMessageField(item => item.t);

	if (type !== E2E_MESSAGE_TYPE || !onEncryptedPress) {
		return null;
	}

	return (
		<MessageActionTouchable
			onPress={onEncryptedPress}
			testID='message-encrypted'
			style={styles.rightIcons}
			hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='encrypted' size={16} />
		</MessageActionTouchable>
	);
};

export default Encrypted;
