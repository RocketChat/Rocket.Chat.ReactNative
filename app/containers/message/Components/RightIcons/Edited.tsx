import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useIsEdited } from '../../MessageStore';

const Edited = ({ testID }: { isEdited: boolean; testID?: string }) => {
	'use memo';

	const isEdited = useIsEdited();

	if (!isEdited) {
		return null;
	}

	return (
		<View testID={testID} style={styles.rightIcons}>
			<CustomIcon name='edit' size={16} />
		</View>
	);
};

export default Edited;
