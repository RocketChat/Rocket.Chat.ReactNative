import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useMessageText } from '../../stores/MessageStore';

const Translated = () => {
	const { isTranslated } = useMessageText();

	if (!isTranslated) {
		return null;
	}

	return (
		<View style={styles.rightIcons}>
			<CustomIcon name='language' size={16} />
		</View>
	);
};

export default Translated;
