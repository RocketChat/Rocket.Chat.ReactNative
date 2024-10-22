import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, SafeAreaView } from 'react-native';
import { parseISO, format } from 'date-fns';

import { hideConfirmationPopup } from '../../actions/confirmationPopup';
import { registerEventRequest } from '../../actions/calendarEvents';

const ConfirmationPopup = ({ event, userName }) => {
	const eventDetails = useMemo(() => {
		return event?.title
			? event
			: {
					title: 'Happy Hour (Zoom)',
					guests: 10,
					dateTime: new Date().toISOString(),
					meetingLink: 'https://ubc.meeting.us/j/69367593586?pwd=VXE1MUVkc1hERmd4SFZiWjlsMDdrZz09'
			  };
	}, [event]);

	const dispatch = useDispatch();

	const handleConfirm = () => {
		dispatch(registerEventRequest(event.id, userName));
		dispatch(hideConfirmationPopup());
	};

	const handleDismiss = () => {
		dispatch(hideConfirmationPopup());
	};

	const getFullDateWithoutTime = (isoDateTime: string) => {
		const date = parseISO(isoDateTime);
		const formattedDate = format(date, 'EEEE, LLLL do'); // Example: 'Monday, June 15th'
		return formattedDate;
	};

	const displayTime = (isoString: string) => format(parseISO(isoString || new Date().toISOString()), 'h:mm a');

	const formattedDate = getFullDateWithoutTime(eventDetails.dateTime);
	const formattedTime = displayTime(eventDetails.dateTime);

	return (
		<View style={styles.fullOverlay}>
			<TouchableWithoutFeedback onPress={handleDismiss}>
				<View style={styles.overlay}></View>
			</TouchableWithoutFeedback>
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.popupContainer}>
					<View style={styles.popup}>
						<Text style={styles.popupTitle}>Confirmation</Text>
						<Text style={styles.eventTitle}>{eventDetails.title}</Text>

						<View style={styles.detailsContainer}>
							<View style={styles.detailRow}>
								<Text style={styles.detailIcon}>👥</Text>
								<Text style={styles.detailText}>{eventDetails.guests || 0} guests</Text>
							</View>
							<View style={styles.detailRow}>
								<Text style={styles.detailIcon}>📅</Text>
								<Text style={styles.detailText}>{formattedDate}</Text>
							</View>
							<View style={styles.detailRow}>
								<Text style={styles.detailIcon}>🕒</Text>
								<Text style={styles.detailText}>{formattedTime}</Text>
							</View>
						</View>

						<Text style={styles.meetingLinkLabel}>Meeting Link</Text>
						<Text style={styles.meetingLink}>{eventDetails.meetingLink || 'Stay tuned'}</Text>

						<TouchableOpacity style={styles.confirmButton} onPress={() => handleConfirm()}>
							<Text style={styles.confirmButtonText}>Confirm</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.helpButton}>
							<Text style={styles.helpButtonText}>Need help? Chat with a research assistant</Text>
						</TouchableOpacity>
					</View>
				</View>
			</SafeAreaView>
		</View>
	);
};

const styles = StyleSheet.create({
	fullOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
		zIndex: 1000
	},
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center'
	},
	safeArea: {
		backgroundColor: 'transparent'
	},
	popupContainer: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20
	},
	popup: {
		padding: 20
	},
	popupTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333'
	},
	eventTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		color: '#000'
	},
	detailsContainer: {
		marginBottom: 20
	},
	detailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10
	},
	detailIcon: {
		fontSize: 18,
		marginRight: 10
	},
	detailText: {
		fontSize: 16,
		color: '#333'
	},
	meetingLinkLabel: {
		fontSize: 14,
		color: '#666',
		marginBottom: 5
	},
	meetingLink: {
		fontSize: 14,
		color: '#0000FF',
		textDecorationLine: 'underline',
		marginBottom: 20
	},
	confirmButton: {
		paddingVertical: 15,
		borderRadius: 25,
		alignItems: 'center',
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#E3E3E3'
	},
	confirmButtonText: {
		color: '#000',
		fontSize: 18,
		fontWeight: 'bold'
	},
	helpButton: {
		alignItems: 'center'
	},
	helpButtonText: {
		color: '#666',
		fontSize: 14,
		textDecorationLine: 'underline'
	}
});

export default ConfirmationPopup;
