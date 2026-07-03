import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useMessageText } from '../../MessageStore';

const Translated = () => {
	'use memo';

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
