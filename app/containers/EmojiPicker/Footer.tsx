import { View, Pressable } from 'react-native';
import type { ReactElement } from 'react';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import type { IFooterProps } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';

const Footer = ({ onSearchPressed, onBackspacePressed }: IFooterProps): ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={[styles.footerContainer, { borderTopColor: colors.strokeExtraLight }]}>
			<Pressable
				onPress={onSearchPressed}
				android_ripple={{ color: colors.buttonBackgroundSecondaryPress }}
				style={({ pressed }) => [
					styles.footerButtonsContainer,
					{ backgroundColor: isIOS && pressed ? colors.buttonBackgroundSecondaryPress : 'transparent' }
				]}
				testID='emoji-picker-search'>
				<CustomIcon size={24} name='search' />
			</Pressable>

			<Pressable
				onPress={onBackspacePressed}
				android_ripple={{ color: colors.buttonBackgroundSecondaryPress }}
				style={({ pressed }) => [
					styles.footerButtonsContainer,
					{ backgroundColor: isIOS && pressed ? colors.buttonBackgroundSecondaryPress : 'transparent' }
				]}
				testID='emoji-picker-backspace'>
				<CustomIcon size={24} name='backspace' />
			</Pressable>
		</View>
	);
};

export default Footer;
