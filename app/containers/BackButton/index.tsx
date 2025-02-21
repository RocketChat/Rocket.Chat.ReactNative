import React from 'react';
import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme';

interface IBackButtonProps extends HeaderBackButtonProps {}

const BackButton = (props: IBackButtonProps) => {
	const { goBack } = useNavigation();
	const { colors } = useTheme();

	return (
		<HeaderBackButton
			onPress={goBack}
			tintColor={colors.fontDefault}
			style={{ marginLeft: 0 }}
			labelVisible={false}
			testID='header-back'
			{...props}
		/>
	);
};

export default BackButton;
