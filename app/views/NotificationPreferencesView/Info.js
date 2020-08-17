import React from 'react';
import {
	Text
} from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';

const Info = React.memo(({ info, theme }) => (
	<Text
		style={[
			styles.infoText,
			{
				color: themes[theme].infoText,
				backgroundColor: themes[theme].auxiliaryBackground
			}
		]}
	>
		{info}
	</Text>
));

Info.propTypes = {
	info: PropTypes.string,
	theme: PropTypes.string
};

export default Info;
