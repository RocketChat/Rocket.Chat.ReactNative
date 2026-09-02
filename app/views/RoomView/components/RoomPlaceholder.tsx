import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CustomIcon, type TIconsName } from '../../../containers/CustomIcon';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';

const GAP = 32;

type RoomPlaceholderProps = {
	icon: TIconsName;
	title: string;
	description: string;
	detail?: ReactNode;
	testID?: string;
	children: ReactNode;
};

export const RoomPlaceholder = ({ icon, title, description, detail, testID, children }: RoomPlaceholderProps) => {
	const { colors } = useTheme();
	const styles = useStyle();

	return (
		<View style={styles.root} testID={testID}>
			<View style={styles.container}>
				<View style={styles.textView}>
					<View style={styles.icon}>
						<CustomIcon name={icon} size={42} color={colors.fontSecondaryInfo} />
					</View>
					<Text style={styles.title}>{title}</Text>
					<Text style={[styles.description, !detail && styles.gapBottom]}>{description}</Text>
					{detail ? <View style={styles.detail}>{detail}</View> : null}
				</View>
				{children}
			</View>
		</View>
	);
};

const useStyle = () => {
	const { colors } = useTheme();
	const styles = StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: colors.surfaceRoom
		},
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
			backgroundColor: colors.surfaceNeutral,
			alignItems: 'center',
			justifyContent: 'center'
		},
		title: {
			...sharedStyles.textBold,
			fontSize: 24,
			lineHeight: 32,
			textAlign: 'center',
			color: colors.fontTitlesLabels,
			marginBottom: GAP
		},
		description: {
			...sharedStyles.textRegular,
			fontSize: 16,
			lineHeight: 24,
			textAlign: 'center',
			color: colors.fontDefault
		},
		detail: { marginBottom: GAP },
		gapBottom: { marginBottom: GAP }
	});
	return styles;
};
