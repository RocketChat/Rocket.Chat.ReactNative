import { type StyleProp, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';

import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	containerNormal: {
		paddingVertical: 3,
		paddingHorizontal: 5,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 10
	},
	containerSmall: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	text: {
		fontSize: 13,
		...sharedStyles.textSemibold
	},
	textSmall: {
		fontSize: 10
	}
});

interface ICountBadge {
	text: string;
	backgroundColor: string;
	color: string;
	small?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}

const CountBadge = ({ text, backgroundColor, color, small, style, testID }: ICountBadge) => {
	const { fontScale } = useWindowDimensions();
	const minWidth = small ? 11 + text.length * 5 : 21;

	return (
		<View
			style={[
				small ? styles.containerSmall : styles.containerNormal,
				{ backgroundColor, minWidth: minWidth * fontScale, borderRadius: 10.5 * fontScale },
				style
			]}
			testID={testID}>
			<Text style={[styles.text, small && styles.textSmall, { color }]} numberOfLines={1}>
				{text}
			</Text>
		</View>
	);
};

export default CountBadge;
