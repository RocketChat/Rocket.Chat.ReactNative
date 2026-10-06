import MessageActionTouchable from '../Touchable/MessageActionTouchable';
import { CustomIcon } from '~/containers/CustomIcon';
import { BUTTON_HIT_SLOP } from '~/containers/message/utils';
import styles from '~/containers/message/styles';
import { E2E_MESSAGE_TYPE } from '~/lib/constants/keys';
import { useMessageField } from '~/containers/message/stores/MessageStore';
import { useOnEncryptedPress } from '~/containers/message/stores/MessageRoomStore';

const Encrypted = () => {
	const onEncryptedPress = useOnEncryptedPress();
	const type = useMessageField(item => item.t);

	if (type !== E2E_MESSAGE_TYPE) {
		return null;
	}

	return (
		<MessageActionTouchable onPress={onEncryptedPress} style={styles.rightIcons} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='encrypted' size={16} />
		</MessageActionTouchable>
	);
};

export default Encrypted;
