import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../theme';
import Touch from '../../utils/touch';
import { CustomIcon, TIconsName } from '../CustomIcon';
import styles from './styles';

interface IButtonService {
	name: string;
	authType: string;
	onPress: () => void;
	backgroundColor: string;
	buttonText: React.ReactElement;
	icon: TIconsName;
}

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
