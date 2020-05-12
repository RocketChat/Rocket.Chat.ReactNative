import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import { themes } from '../../constants/colors';
import styles from './styles';

const Header = React.memo(({ header, title, theme }) => (
	<>
		<View style={[styles.header, { backgroundColor: themes[theme].backgroundColor }]}>
			<View style={[styles.headerIndicator, { backgroundColor: themes[theme].auxiliaryText }]} />
		</View>
		{
			title
				? (
					<View style={[styles.headerTitle, { backgroundColor: themes[theme].backgroundColor }]}>
						<Text style={[styles.headerTitleText, { color: themes[theme].titleText }]}>
							{title}
						</Text>
					</View>
				)
				: header
		}
	</>
));
Header.propTypes = {
	header: PropTypes.node,
	title: PropTypes.string,
	theme: PropTypes.string
};
export default Header;
