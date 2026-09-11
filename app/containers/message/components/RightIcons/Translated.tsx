import { View } from 'react-native';

import { CustomIcon } from '~/containers/CustomIcon';
import styles from '~/containers/message/styles';
import { useMessageText } from '~/containers/message/stores/MessageStore';

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
