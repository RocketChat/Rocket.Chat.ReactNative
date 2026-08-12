import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useIsEdited, useMessageText } from '../../stores/MessageStore';

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
