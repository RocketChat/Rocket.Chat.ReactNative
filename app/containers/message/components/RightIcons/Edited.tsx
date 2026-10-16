import { View } from 'react-native';

import { CustomIcon } from '~/containers/CustomIcon';
import styles from '~/containers/message/styles';
import { useIsEdited, useMessageText } from '~/containers/message/stores/MessageStore';

const Edited = () => {
	const isEdited = useIsEdited();
	const { messageText } = useMessageText();

	if (!isEdited) {
		return null;
	}

	return (
		<View testID={`${messageText}-edited`} style={styles.rightIcons}>
			<CustomIcon name='edit' size={16} />
		</View>
	);
};

export default Edited;
