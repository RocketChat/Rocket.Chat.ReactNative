import { useNavigation } from '@react-navigation/native';
import { type Dispatch, type SetStateAction, type ReactElement } from 'react';
import { Linking, Text, View } from 'react-native';
import Modal from 'react-native-modal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../Styles';
import Button from '../../containers/Button';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../selectors/login';
import i18n from '../../i18n';

const styles = StyleSheet.create(theme => ({
	title: {
		...sharedStyles.textBold,
		fontSize: 24,
		marginBottom: 24,
		color: theme.colors.fontTitlesLabels
	},
	regular: {
		...sharedStyles.textRegular,
		fontSize: 16,
		marginBottom: 24,
		color: theme.colors.fontTitlesLabels
	},
	min: {
		...sharedStyles.textRegular,
		fontSize: 12,
		marginBottom: 24,
		color: theme.colors.fontSecondaryInfo
	},
	container: { padding: 24, borderRadius: 8, backgroundColor: theme.colors.surfaceRoom },
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	}
}));

const JitsiAuthModal = ({
	setAuthModal,
	callUrl
}: {
	setAuthModal: Dispatch<SetStateAction<boolean>>;
	callUrl: string;
}): ReactElement => {
	const { goBack } = useNavigation();
	const user = useAppSelector(state => getUserSelector(state));

	const isAdmin = !!user.roles?.includes('admin');

	return (
		<Modal isVisible>
			<GestureHandlerRootView style={styles.container}>
				<Text style={styles.title}>{i18n.t('Jitsi_may_require_authentication')}</Text>
				{isAdmin ? (
					<Text style={styles.regular}>{i18n.t('Jitsi_authentication_before_making_calls_admin')}</Text>
				) : (
					<Text style={styles.regular}>{i18n.t('Jitsi_authentication_before_making_calls')}</Text>
				)}
				{!isAdmin ? <Text style={styles.min}>{i18n.t('Jitsi_authentication_before_making_calls_ask_admin')}</Text> : null}
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
