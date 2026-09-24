import { useNavigation } from '@react-navigation/native';
import { type Dispatch, type SetStateAction, type ReactElement } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { PlainText } from 'react-native-plain-text';
import Modal from 'react-native-modal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import sharedStyles from '../Styles';
import Button from '~/containers/Button';
import { useTheme } from '~/theme';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';
import i18n from '~/i18n';

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
	setAuthModal: Dispatch<SetStateAction<boolean>>;
	callUrl: string;
}): ReactElement => {
	const { goBack } = useNavigation();
	const { colors } = useTheme();
	const user = useAppSelector(state => getUserSelector(state));

	const isAdmin = !!user.roles?.includes('admin');

	return (
		<Modal isVisible>
			<GestureHandlerRootView style={[styles.container, { backgroundColor: colors.surfaceRoom }]}>
				<PlainText style={[styles.title, { color: colors.fontTitlesLabels }]}>
					{i18n.t('Jitsi_may_require_authentication')}
				</PlainText>
				{isAdmin ? (
					<PlainText style={[styles.regular, { color: colors.fontTitlesLabels }]}>
						{i18n.t('Jitsi_authentication_before_making_calls_admin')}
					</PlainText>
				) : (
					<PlainText style={[styles.regular, { color: colors.fontTitlesLabels }]}>
						{i18n.t('Jitsi_authentication_before_making_calls')}
					</PlainText>
				)}
				{!isAdmin ? (
					<PlainText style={[styles.min, { color: colors.fontSecondaryInfo }]}>
						{i18n.t('Jitsi_authentication_before_making_calls_ask_admin')}
					</PlainText>
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
			</GestureHandlerRootView>
		</Modal>
	);
};

export default JitsiAuthModal;
