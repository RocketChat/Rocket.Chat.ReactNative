import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../../containers/Button';
import { CustomIcon } from '../../../containers/CustomIcon';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';

const GAP = 32;

export const RoomLoadFailed = ({ onRetry }: { onRetry: () => void }): ReactElement => {
	const { colors } = useTheme();
	const styles = useStyle();
	return (
		<View style={styles.root} testID='room-load-failed'>
			<View style={styles.container}>
				<View style={styles.textView}>
					<View style={styles.icon}>
						<CustomIcon name='warning' size={42} color={colors.fontSecondaryInfo} />
					</View>
					<Text style={styles.title}>{I18n.t('Oops')}</Text>
					<Text style={styles.description}>{I18n.t('Room_failed_to_load')}</Text>
				</View>
				<Button title={I18n.t('Try_again')} type='primary' onPress={onRetry} testID='room-load-failed-retry' />
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
			color: colors.fontDefault,
			marginBottom: GAP
		}
	});
	return styles;
};
