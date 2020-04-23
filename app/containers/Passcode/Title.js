import React from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';

const Title = ({ theme }) => (
	<Text
		style={[
			styles.textTitle,
			{
				color: themes[theme].titleText,
				opacity: 1 //opacityTitle
			}
		]}
	>
		{/* {(attemptFailed && this.props.titleAttemptFailed) ||
		(showError && this.props.titleConfirmFailed) ||
		(showError && this.props.titleValidationFailed) ||
		this.props.sentenceTitle} */}
		Title
	</Text>
);
export default Title;
