import React from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';

const Subtitle = ({ theme }) => (
	<Text
		style={[
			styles.textSubtitle,
			{
				color: themes[theme].bodyText,
				opacity: 1 //opacityTitle
			}
		]}
	>
		{/* {attemptFailed || showError
          ? this.props.subtitleError
          : this.props.subtitle} */}
		Subtitle
	</Text>
);
export default Subtitle;
