import React from 'react';
import { Text, View } from 'react-native';
import Modal from 'react-native-modal';

import { IConfirmOwnerChangeWarningModalProps } from '../../definitions/IProfileViewInterfaces';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { themes } from '../../constants/colors';
import Button from '../../containers/Button';
import styles from './styles';

const ConfirmOwnerChangeWarningModal = React.memo(
	({
		confirmOwnerChangeModalVisible,
		onConfirm,
		onCancel,
		modalTitle,
		contentTitle,
		shouldChangeOwner,
		shouldBeRemoved
	}: IConfirmOwnerChangeWarningModalProps) => {
		let changeOwnerRooms = '';
		if (shouldChangeOwner.length > 0) {
			if (shouldChangeOwner.length === 1) {
				changeOwnerRooms = I18n.t('A_new_owner_will_be_assigned_automatically_to_the__roomName__room', {
					roomName: shouldChangeOwner.pop()
				});
			} else if (shouldChangeOwner.length <= 5) {
				changeOwnerRooms = I18n.t('A_new_owner_will_be_assigned_automatically_to_those__count__rooms__rooms__', {
					count: shouldChangeOwner.length,
					rooms: shouldChangeOwner.join(', ')
				});
			} else {
				changeOwnerRooms = I18n.t('A_new_owner_will_be_assigned_automatically_to__count__rooms', {
					count: shouldChangeOwner.length
				});
			}
		}

		let removedRooms = '';
		if (shouldBeRemoved.length > 0) {
			if (shouldBeRemoved.length === 1) {
				removedRooms = I18n.t('The_empty_room__roomName__will_be_removed_automatically', {
					roomName: shouldBeRemoved.pop()
				});
			} else if (shouldBeRemoved.length <= 5) {
				removedRooms = I18n.t('__count__empty_rooms_will_be_removed_automatically__rooms__', {
					count: shouldBeRemoved.length,
					rooms: shouldBeRemoved.join(', ')
				});
			} else {
				removedRooms = I18n.t('__count__empty_rooms_will_be_removed_automatically', {
					count: shouldBeRemoved.length
				});
			}
		}

		const { theme } = useTheme();
		const color = themes[theme!].titleText;
		return (
			<Modal
				// @ts-ignore
				transparent
				avoidKeyboard
				useNativeDriver
				isVisible={confirmOwnerChangeModalVisible}
				hideModalContentWhileAnimating>
				<View style={styles.container}>
					<View style={[styles.content, { backgroundColor: themes[theme!].backgroundColor }]}>
						<Text style={[styles.title, { color }]}>{modalTitle}</Text>
						<View style={styles.description}>
							<Text style={[styles.contentTitle, { color }]}>{contentTitle}</Text>
							{changeOwnerRooms !== '' && <Text style={[{ color }]}>{changeOwnerRooms}</Text>}
							{removedRooms !== '' && <Text style={[styles.removedRooms, { color }]}>{removedRooms}</Text>}
						</View>

						<View style={styles.buttonContainer}>
							<Button
								title={I18n.t('Cancel')}
								type='secondary'
								backgroundColor={themes[theme!].chatComponentBackground}
								style={styles.button}
								onPress={onCancel}
								theme={theme}
							/>
							<Button
								title={I18n.t('Delete')}
								type='primary'
								backgroundColor={themes[theme!].dangerColor}
								style={styles.button}
								onPress={onConfirm}
								theme={theme}
							/>
						</View>
					</View>
				</View>
			</Modal>
		);
	}
);

export default ConfirmOwnerChangeWarningModal;
