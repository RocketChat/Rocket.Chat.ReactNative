import React, { useEffect, useState } from 'react';
import { Image, ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, parse } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';

import * as HeaderButton from '../../containers/HeaderButton';
import { cancelEventEdit, createEventDraft, createEventRequest, updateEventRequest } from '../../actions/calendarEvents';
import { getUserSelector } from '../../selectors/login';
import { getCalendarEventsSelector, getDraftEventSelector } from '../../selectors/event';
import { IApplicationState } from '../../definitions';
import Avatar from '../../containers/Avatar';

const leftArrow = require('../../static/images/discussionboard/arrow_left.png');

const CreateEventView = () => {
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);

	const dispatch = useDispatch();
	const navigation = useNavigation<StackNavigationProp<any>>();
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const { isEditing } = useSelector((state: IApplicationState) => getCalendarEventsSelector(state));
	const draftEvent = useSelector((state: IApplicationState) => getDraftEventSelector(state));
	const userName = user?.username || '';

	const backAction = () => {
		dispatch(cancelEventEdit());
		navigation.goBack();
	};

	useEffect(() => {
		navigation.setOptions({ title: '', headerStyle: { shadowColor: 'transparent' } });
		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity style={{ marginLeft: 20 }} onPress={() => backAction()}>
					<Image source={leftArrow} style={{ width: 11, height: 19 }} resizeMode='contain' />
				</TouchableOpacity>
			),
			headerRight: () => (
				<HeaderButton.Container>
					<Touchable style={{ marginRight: 20 }} onPress={() => navigation.navigate('ProfileView')}>
						{userName ? <Avatar text={userName} size={24} borderRadius={12} /> : <></>}
					</Touchable>
				</HeaderButton.Container>
			)
		});

		if (!isEditing) {
			const defaultEvent = {
				description: draftEvent?.description ?? 'Event description',
				title: draftEvent?.title ?? 'Event title',
				dateTime: new Date().toISOString(),
				peers: draftEvent?.peers ?? [],
				attendees: draftEvent?.attendees ?? []
			};
			dispatch(createEventDraft(defaultEvent));
		}
	}, []);

	const onTitleChange = (title: string) => {
		dispatch(createEventDraft({ title }));
	};
	const onDescriptionChange = (description: string) => {
		dispatch(createEventDraft({ description }));
	};
	const onMeetingLinkChange = (meetingLink: string) => {
		dispatch(createEventDraft({ meetingLink }));
	};

	const onDateChange = (event, selectedDate) => {
		setShowDatePicker(false);
		if (selectedDate) {
			const newDate = new Date(draftEvent.dateTime);
			newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
			dispatch(createEventDraft({ dateTime: newDate.toISOString() }));
		}
	};

	const onTimeChange = (event, selectedTime) => {
		setShowTimePicker(false);
		if (selectedTime) {
			const newTime = new Date(draftEvent.dateTime);
			newTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
			dispatch(createEventDraft({ dateTime: newTime.toISOString() }));
		}
	};

	const removePeer = (username: string) => {
		const newPeers = draftEvent?.peers?.filter(peer => peer.username !== username);
		dispatch(createEventDraft({ peers: newPeers }));
	};

	const createOrUpdateEvent = async () => {
		if (isEditing) {
			dispatch(updateEventRequest());
		} else {
			dispatch(createEventRequest());
		}
		navigation.navigate('CalendarView');
	};

	const dateTime = new Date(draftEvent.dateTime);
	const displayDate = (isoString: string) => format(parseISO(isoString || new Date().toISOString()), 'MM/dd/yyyy');
	const displayTime = (isoString: string) => format(parseISO(isoString || new Date().toISOString()), 'h:mm a');

	const formattedDate = displayDate(draftEvent.dateTime);
	const formattedTime = displayTime(draftEvent.dateTime);

	return (
		<ScrollView style={styles.container}>
			<Text style={styles.header}>Create Event</Text>

			<Text style={styles.label}>Title</Text>
			<TextInput
				style={styles.input}
				value={isEditing && draftEvent.title}
				onChangeText={onTitleChange}
				placeholder='Enter event title'
			/>

			<View style={styles.rowContainer}>
				<Text style={styles.label}>Date</Text>
				<TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
					<Text style={styles.dateTimeText}>{formattedDate}</Text>
				</TouchableOpacity>
			</View>
			{showDatePicker && <DateTimePicker value={dateTime} mode='date' display='default' onChange={onDateChange} />}

			<View style={styles.rowContainer}>
				<Text style={styles.label}>Time</Text>
				<TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
					<Text style={styles.dateTimeText}>{formattedTime}</Text>
				</TouchableOpacity>
			</View>

			{showTimePicker && (
				<DateTimePicker value={dateTime} mode='time' is24Hour={true} display='default' onChange={onTimeChange} />
			)}

			<Text style={styles.label}>Description</Text>
			<TextInput
				style={[styles.input, styles.textArea]}
				placeholder='Describe your event'
				value={isEditing && draftEvent.description}
				onChangeText={onDescriptionChange}
				multiline
				numberOfLines={4}
			/>

			<Text style={styles.label}>Meeting Link</Text>
			<TextInput
				style={styles.input}
				placeholder='Enter Meeting link'
				value={draftEvent.meetingLink}
				onChangeText={onMeetingLinkChange}
			/>

			<View style={styles.rowContainer}>
				<Text style={styles.sectionTitle}>Peer Supporters</Text>
				<TouchableOpacity style={styles.addPeersButton} onPress={() => navigation.navigate('SearchPeersView')}>
					<Text style={styles.addPeersButtonText}>Add Peers</Text>
				</TouchableOpacity>
			</View>

			{draftEvent?.peers?.map((peer, index) => (
				<View key={index} style={styles.peerItem}>
					<Avatar text={peer.username} size={36} borderRadius={18} />
					<Text style={styles.peerName}>{peer.username}</Text>
					<TouchableOpacity onPress={() => removePeer(peer.username)} style={styles.removePeerButton}>
						<Text style={styles.removePeerButtonText}>x</Text>
					</TouchableOpacity>
				</View>
			))}

			<TouchableOpacity style={styles.createEventButton} onPress={() => createOrUpdateEvent()}>
				<Text style={styles.createEventButtonText}>{isEditing ? 'Save' : 'Create Event'}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff'
	},
	header: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center'
	},

	headerText: {
		fontSize: 20,
		fontWeight: 'bold',
		marginLeft: 20
	},
	input: {
		borderWidth: 1,
		borderColor: '#e0e0e0',
		borderRadius: 8,
		padding: 15,
		marginBottom: 15,
		fontSize: 16
	},
	textArea: {
		height: 100,
		textAlignVertical: 'top'
	},
	label: {
		fontSize: 16,
		marginBottom: 8
	},
	rowContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16
	},
	dateTimeButton: {
		borderRadius: 8,
		padding: 12,
		minWidth: 150,
		alignItems: 'flex-end'
	},
	dateTimeText: {
		fontWeight: 'bold'
	},
	sectionTitle: {
		fontSize: 18,
		marginTop: 20,
		marginBottom: 10
	},
	addPeersButton: {
		borderWidth: 1,
		borderColor: '#ff69b4',
		borderRadius: 25,
		padding: 10,
		alignItems: 'center',
		marginBottom: 15
	},
	addPeersButtonText: {
		color: '#ff69b4',
		fontSize: 16
	},
	peerItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10
	},
	peerName: {
		fontSize: 16
	},
	removePeerButton: {
		backgroundColor: '#F5F4F2',
		borderRadius: 15,
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center'
	},
	removePeerButtonText: {
		color: '#000000',
		fontSize: 16,
		marginBottom: 5
	},
	createEventButton: {
		backgroundColor: '#799A79',
		borderRadius: 25,
		padding: 15,
		alignItems: 'center',
		marginTop: 20,
		marginBottom: 20
	},
	createEventButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold'
	}
});

export default CreateEventView;
