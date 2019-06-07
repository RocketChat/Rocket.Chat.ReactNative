import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';

const InfoButton = React.memo(({ title, subTitle, testID }) => (
	<View style={styles.infoButton} testID={testID}>
		<Text style={styles.sectionItemTitle}>{title}</Text>
		{subTitle
			? <Text style={styles.sectionItemSubTitle}>{subTitle}</Text>
			: null
		}
	</View>
));

InfoButton.propTypes = {
	title: PropTypes.string.isRequired,
	subTitle: PropTypes.string,
	testID: PropTypes.string
};

export default InfoButton;
