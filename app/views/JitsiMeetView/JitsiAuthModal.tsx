import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Modal from 'react-native-modal';

import sharedStyles from '../Styles';
import Button from '../../containers/Button';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';
import i18n from '../../i18n';

const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 24,
		marginBottom: 24
	},
	regular: {
		...sharedStyles.textRegular,
		fontSize: 16,
		marginBottom: 24
	},
	min: {
		...sharedStyles.textRegular,
		fontSize: 12,
		marginBottom: 24
	},
	container: { padding: 24, borderRadius: 8 },
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	}
});

const JitsiAuthModal = ({
	setAuthModal,
	callUrl
}: {
	setAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
	callUrl: string;
}): React.ReactElement => {
	const { goBack } = useNavigation();
	const { colors } = useTheme();
	const user = useAppSelector(state => getUserSelector(state));

	const isAdmin = !!user.roles?.includes('admin');

	return (
		<Modal isVisible>
			<View style={[styles.container, { backgroundColor: colors.surfaceRoom }]}>
				<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{i18n.t('Jitsi_may_require_authentication')}</Text>
				{isAdmin ? (
					<Text style={[styles.regular, { color: colors.fontTitlesLabels }]}>
						{i18n.t('Jitsi_authentication_before_making_calls_admin')}
					</Text>
				) : (
					<Text style={[styles.regular, { color: colors.fontTitlesLabels }]}>
						{i18n.t('Jitsi_authentication_before_making_calls')}
					</Text>
				)}
				{!isAdmin ? (
					<Text style={[styles.min, { color: colors.fontSecondaryInfo }]}>
						{i18n.t('Jitsi_authentication_before_making_calls_ask_admin')}
					</Text>
				) : null}
				<View style={styles.buttonContainer}>
					<Button title={i18n.t('Cancel')} type='secondary' onPress={() => setAuthModal(false)} />
					<Button
						title={i18n.t('Continue')}
						onPress={() => {
							setAuthModal(false);
							goBack();
							Linking.openURL(callUrl);
						}}
					/>
				</View>
			</View>
		</Modal>
	);
};

export default JitsiAuthModal;
