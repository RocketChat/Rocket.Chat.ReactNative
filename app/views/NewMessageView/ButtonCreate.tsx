import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { themes } from '../../lib/constants';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import { useTheme } from '../../theme';
import Touch from '../../containers/Touch';
import sharedStyles from '../Styles';
import { PADDING_HORIZONTAL } from '../../containers/List/constants';

const styles = StyleSheet.create({
	button: {
		height: 46,
		flexDirection: 'row',
		alignItems: 'center'
	},
	buttonIcon: {
		marginLeft: 18,
		marginRight: 16
	},
	buttonText: {
		fontSize: 17,
		...sharedStyles.textRegular
	},
	rightContainer: {
		paddingLeft: PADDING_HORIZONTAL,
		alignItems: 'flex-end',
		flex: 1
	}
});

interface IButton {
	onPress: () => void;
	testID: string;
	title: string;
	icon: TIconsName;
	first?: boolean;
}

const ButtonCreate = ({ onPress, testID, title, icon, first }: IButton) => {
	const { theme } = useTheme();

	return (
		<Touch onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }} testID={testID}>
			<View
				style={[
					first ? sharedStyles.separatorVertical : sharedStyles.separatorBottom,
					styles.button,
					{ borderColor: themes[theme].separatorColor }
				]}
			>
				<CustomIcon name={icon} size={24} color={themes[theme].bodyText} style={styles.buttonIcon} />
				<Text style={[styles.buttonText, { color: themes[theme].bodyText }]}>{title}</Text>
				<View style={styles.rightContainer}>
					<CustomIcon name={'chevron-right'} size={24} color={themes[theme].bodyText} style={styles.buttonIcon} />
				</View>
			</View>
		</Touch>
	);
};

export default ButtonCreate;
