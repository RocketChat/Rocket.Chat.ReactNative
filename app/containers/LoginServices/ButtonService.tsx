import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../theme';
import Touch from '../../lib/methods/helpers/touch';
import { CustomIcon } from '../CustomIcon';
import { IButtonService } from './interfaces';
import styles from './styles';

const ButtonService = ({ name, authType, onPress, backgroundColor, buttonText, icon }: IButtonService) => {
	const { theme, colors } = useTheme();

	return (
		<Touch
			key={name}
			onPress={onPress}
			style={[styles.serviceButton, { backgroundColor }]}
			theme={theme}
			activeOpacity={0.5}
			underlayColor={colors.buttonText}>
			<View style={styles.serviceButtonContainer}>
				{authType === 'oauth' || authType === 'apple' ? (
					<CustomIcon name={icon} size={24} color={colors.titleText} style={styles.serviceIcon} />
				) : null}
				<Text style={[styles.serviceText, { color: colors.titleText }]}>{buttonText}</Text>
			</View>
		</Touch>
	);
};

export default ButtonService;
