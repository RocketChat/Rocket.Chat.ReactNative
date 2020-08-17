import React from 'react';
import {
	Text
} from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';

const SectionTitle = React.memo(({ title, theme }) => (
	<Text
		style={[
			styles.sectionTitle,
			{
				backgroundColor: themes[theme].auxiliaryBackground,
				color: themes[theme].infoText
			}
		]}
	>
		{title}
	</Text>
));

SectionTitle.propTypes = {
	title: PropTypes.string,
	theme: PropTypes.string
};

export default SectionTitle;
