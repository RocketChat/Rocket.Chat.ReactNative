import Touchable from '../../Touchable';
import { CustomIcon } from '../../../CustomIcon';
import { BUTTON_HIT_SLOP } from '../../utils';
import styles from '../../styles';
import { E2E_MESSAGE_TYPE } from '../../../../lib/constants/keys';
import { useMessageField } from '../../MessageStore';
import { useOnEncryptedPress } from '../../MessageRoomStore';

const Encrypted = (_props: { type: string }) => {
	'use memo';

	const onEncryptedPress = useOnEncryptedPress();
	const type = useMessageField(item => item.t);

	if (type !== E2E_MESSAGE_TYPE) {
		return null;
	}

	return (
		<Touchable onPress={onEncryptedPress} style={styles.rightIcons} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='encrypted' size={16} />
		</Touchable>
	);
};

export default Encrypted;
