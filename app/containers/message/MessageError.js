import React from 'react';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import { COLOR_DANGER } from '../../constants/colors';
import styles from './styles';

const RenderMessageError = React.memo((props) => {
	if (!props.hasError) {
		return null;
	}
	return (
		<Touchable onPress={props.onErrorPress} style={styles.errorButton}>
			<CustomIcon name='circle-cross' color={COLOR_DANGER} size={20} />
		</Touchable>
	);
});

export default RenderMessageError;
