import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import i18n from '../../../../i18n';
import sharedStyles from '../../../Styles';
import FooterButtons from './FooterButtons';
import AlertText from './AlertText';
import { deleteOwnAccount } from '../../../../lib/services/restApi';
import { deleteAccount } from '../../../../actions/login';
import { CustomIcon } from '../../../../containers/CustomIcon';
import { useTheme } from '../../../../theme';
import { useActionSheet } from '../../../../containers/ActionSheet/Provider';

const styles = StyleSheet.create({
	subtitleText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24
	},
	titleContainerText: {
		...sharedStyles.textBold,
		fontSize: 16,
		lineHeight: 24,
		paddingLeft: 12
	},
	titleContainer: {
		paddingRight: 80,
		marginBottom: 12,
		flexDirection: 'row',
		alignItems: 'center'
	},
	changeOwnerRoomsAlert: {
		marginTop: 24
	},
	removedRoomsAlert: {
		marginBottom: 36
	}
});

interface IConfirmDeleteAccountContent {
	password: string;
	changeOwnerRooms: string;
	removedRooms: string;
}

const ConfirmDeleteAccountContent = ({
	password,
	changeOwnerRooms,
	removedRooms
}: IConfirmDeleteAccountContent): React.ReactElement => {
	const { colors } = useTheme();
	const dispatch = useDispatch();
	const { hideActionSheet } = useActionSheet();

	const handleDeleteAccount = async () => {
		hideActionSheet();
		await deleteOwnAccount(password, true);
		dispatch(deleteAccount());
	};

	return (
		<View style={sharedStyles.containerScrollView} testID='action-sheet-content-with-input-and-submit'>
			<View accessible accessibilityLabel={i18n.t('Are_you_sure_question_mark')} style={styles.titleContainer}>
				<CustomIcon name={'warning'} size={32} color={colors.buttonBackgroundDangerDefault} />
				<Text style={[styles.titleContainerText, { color: colors.fontDefault }]}>{i18n.t('Are_you_sure_question_mark')}</Text>
			</View>
			<Text style={[styles.subtitleText, { color: colors.fontTitlesLabels }]}>
				{i18n.t('Deleting_a_user_will_delete_all_messages')}
			</Text>
			{changeOwnerRooms ? <AlertText text={changeOwnerRooms} style={styles.changeOwnerRoomsAlert} /> : null}
			{removedRooms ? <AlertText text={removedRooms} style={styles.removedRoomsAlert} /> : null}

			<FooterButtons
				confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
				cancelAction={hideActionSheet}
				confirmAction={handleDeleteAccount}
				cancelTitle={i18n.t('Cancel')}
				confirmTitle={i18n.t('Delete_Account_confirm')}
				testID={'room-info-edit-view-name'}
			/>
		</View>
	);
};

export default ConfirmDeleteAccountContent;
