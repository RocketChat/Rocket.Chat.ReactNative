import { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CustomIcon, type TIconsName } from '../../../containers/CustomIcon';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';

const GAP = 32;

const styles = StyleSheet.create({
	root: { flex: 1 },
	container: {
		flex: 1,
		marginHorizontal: 24,
		justifyContent: 'center'
	},
	textView: { alignItems: 'center' },
	icon: {
		width: 58,
		height: 58,
		borderRadius: 30,
		marginBottom: GAP,
		alignItems: 'center',
		justifyContent: 'center'
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 24,
		lineHeight: 32,
		textAlign: 'center',
		marginBottom: GAP
	},
	description: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24,
		textAlign: 'center'
	},
	gapBottom: { marginBottom: GAP }
});

interface RoomPlaceholderProps {
	icon: TIconsName;
	title: string;
	description: string;
	detail?: ReactNode;
	testID?: string;
	children: ReactNode;
}

export const RoomPlaceholder = ({ icon, title, description, detail, testID, children }: RoomPlaceholderProps): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={[styles.root, { backgroundColor: colors.surfaceRoom }]} testID={testID}>
			<View style={styles.container}>
				<View style={styles.textView}>
					<View style={[styles.icon, { backgroundColor: colors.surfaceNeutral }]}>
						<CustomIcon name={icon} size={42} color={colors.fontSecondaryInfo} />
					</View>
					<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{title}</Text>
					<Text style={[styles.description, { color: colors.fontDefault }, !detail && styles.gapBottom]}>{description}</Text>
					{detail ? <View style={styles.gapBottom}>{detail}</View> : null}
				</View>
				{children}
			</View>
		</View>
	);
};
