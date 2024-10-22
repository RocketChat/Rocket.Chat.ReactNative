import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { IApplicationState } from '../../definitions';
import { hideRemoveEventPopup } from '../../actions/confirmationPopup';
import { deleteEventRequest, deregisterEventRequest } from '../../actions/calendarEvents';
import { getUserSelector } from '../../selectors/login';

const RemoveEventPopup = ({ eventId, attendeeId }: { eventId: string; attendeeId: string }) => {
	const dispatch = useDispatch();
	const navigation = useNavigation<StackNavigationProp<any>>();

	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const isAdmin = user?.roles && user?.roles.includes('admin');

	const handleRemove = () => {
		if (isAdmin) {
			dispatch(deleteEventRequest(eventId));
		} else {
			dispatch(deregisterEventRequest(eventId, attendeeId));
		}
		dispatch(hideRemoveEventPopup());
		navigation.goBack();
	};

	const handleDismiss = () => {
		dispatch(hideRemoveEventPopup());
	};

	return (
		<Modal transparent={true} onRequestClose={handleDismiss}>
			<TouchableWithoutFeedback onPress={handleDismiss}>
				<View style={styles.fullScreen}>
					<View style={styles.topModalButton}>
						<View style={styles.contentContainer}>
							<Text style={styles.title}>Are you sure you want to remove this event from the calendar?</Text>
						</View>
						<TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
							<Text style={styles.removeButtonText}>Remove event</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.bottomModalButton}>
						<TouchableOpacity style={styles.cancelButton} onPress={handleDismiss}>
							<Text style={styles.cancelButtonText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

const styles = StyleSheet.create({
	fullScreen: {
		flex: 1,
		justifyContent: 'flex-end',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
		paddingBottom: 20
	},
	topModalButton: {
		width: '90%',
		backgroundColor: 'white',
		borderRadius: 10,
		paddingTop: 20,
		paddingBottom: 10,
		marginBottom: 10,
		alignItems: 'center'
	},
	bottomModalButton: {
		width: '90%',
		backgroundColor: 'white',
		borderRadius: 10,
		paddingTop: 10,
		paddingBottom: 10,
		marginBottom: 10,
		alignItems: 'center'
	},
	contentContainer: {
		width: '100%',
		paddingHorizontal: 20,
		paddingBottom: 20
	},
	title: {
		fontSize: 13,
		fontWeight: '400',
		textAlign: 'center',
		color: '#3C3C4399'
	},
	removeButton: {
		width: '100%',
		paddingVertical: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: '#CCCCCC'
	},
	removeButtonText: {
		color: '#FF3B30',
		textAlign: 'center',
		fontSize: 20,
		fontWeight: '400'
	},
	buttonSeparator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#CCCCCC',
		width: '100%'
	},
	cancelButton: {
		width: '100%',
		paddingVertical: 12
	},
	cancelButtonText: {
		color: '#007AFF',
		textAlign: 'center',
		fontSize: 20,
		fontWeight: '600'
	}
});

export default RemoveEventPopup;
