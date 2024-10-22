import React, { useEffect, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { parseISO, format } from 'date-fns';

import * as HeaderButton from '../../containers/HeaderButton';
import { getUserSelector } from '../../selectors/login';
import { getPressedEventSelector, getPopupSelector } from '../../selectors/event';
import { IApplicationState } from '../../definitions';
import Avatar from '../../containers/Avatar';
import { CustomIcon } from '../../containers/CustomIcon';
import { showConfirmationPopup, showRemoveEventPopup } from '../../actions/confirmationPopup';
import { editEvent } from '../../actions/calendarEvents';
import RemoveEventPopup from './RemoveEventPopup';

import { getRoomTitle, getUidDirectMessage } from '../../lib/methods/helpers';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { Services } from '../../lib/services';
import addToPersonalCalendar from './Permissions';

const EventDetailsView = () => {
	const navigation = useNavigation<StackNavigationProp<any>>();

	const dispatch = useDispatch();

	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const eventDetails = useSelector((state: IApplicationState) => getPressedEventSelector(state));
	const { attendees, title, dateTime, description, meetingLink, peers, id: eventId } = eventDetails;
	const isAdmin = user?.roles && user?.roles.includes('admin');
	const userName = user?.username;

	const isAttending = useMemo(() => attendees.includes(userName), [attendees, userName]);

	const { shouldShowRemoveEventPopup, removeEventPopupDetails } = useSelector((state: IApplicationState) =>
		getPopupSelector(state)
	);

	useEffect(() => {
		navigation.setOptions({ title: '', headerStyle: { shadowColor: 'transparent' } });
		navigation.setOptions({
			headerRight: () => (
				<HeaderButton.Container>
					<View style={styles.iconContainer}>
						{(isAdmin || isAttending) && (
							<Touchable style={{ marginRight: 20 }} onPress={() => handleDeleteEvent()}>
								<CustomIcon name='delete' size={24} color='#CB007B' />
							</Touchable>
						)}
						{isAdmin && (
							<Touchable style={{ marginRight: 20 }} onPress={() => handleEditEvent()}>
								<CustomIcon name='edit' size={24} color='#CB007B' />
							</Touchable>
						)}
					</View>
				</HeaderButton.Container>
			)
		});
	});

	const handleEditEvent = async () => {
		dispatch(editEvent(eventDetails));
		navigation.navigate('CreateEventView');
	};

	const handleDeleteEvent = async () => {
		dispatch(showRemoveEventPopup({ eventDetails, attendeeId: userName }));
	};

	const handleRegister = () => {
		navigation.goBack();
		dispatch(showConfirmationPopup({ eventDetails }));
	};

	const visitPeerProfile = peer => {
		const peerUser = { id: peer._id, username: peer.username };

		navigation.navigate('ConnectView', { user: peerUser });
	};

	const handleCreateDirectMessage = async (onPress: (rid: string) => void, peer) => {
		try {
			const result = await Services.createDirectMessage(peer.username);
			if (result.success) {
				const {
					room: { rid }
				} = result;
				if (rid) {
					onPress(rid);
				}
			}
		} catch {}
	};

	const goToRoom = (rid: string) => {
		const room = { rid: rid, t: 'd' };

		const params = {
			rid: room.rid,
			name: getRoomTitle(room),
			t: room.t,
			roomUserId: getUidDirectMessage(room)
		};

		if (room.rid) {
			try {
				goRoom({ item: params, isMasterDetail: true, popToRoot: true });
			} catch (e) {
				console.log(e);
			}
		}
	};

	const RegisterButton = () => (
		<TouchableOpacity style={styles.createEventButton} onPress={() => handleRegister()}>
			<Text style={styles.createEventButtonText}>Register</Text>
		</TouchableOpacity>
	);
	const AttendingButton = () => (
		<TouchableOpacity style={styles.attendingButton} onPress={() => navigation.goBack()}>
			<CustomIcon style={{ marginRight: 10 }} name='check' size={24} color='#fff' />
			<Text style={styles.attendingButtonText}>Attending</Text>
		</TouchableOpacity>
	);
	const DoneButton = () => (
		<TouchableOpacity style={styles.createEventButton} onPress={() => navigation.goBack()}>
			<Text style={styles.createEventButtonText}>Done</Text>
		</TouchableOpacity>
	);

	const AddToCalendarButton = () => {
		return (
			<TouchableOpacity style={styles.addToCalendarButton} onPress={() => addToPersonalCalendar(eventDetails)}>
				<CustomIcon style={{ marginRight: 10 }} name='calendar' size={24} color='#CB007B' />
				<Text style={styles.addToCalendarText}>Add to calendar</Text>
			</TouchableOpacity>
		);
	};

	const getFullDateWithTime = (isoDateTime: string) => {
		const date = parseISO(isoDateTime);
		const formattedDate = format(date, 'EEEE, LLLL do'); // Example: 'Monday, June 15th'
		const formattedTime = format(date, 'h:mm a'); // Example: '3:45 PM'
		return `${formattedDate} • ${formattedTime}`;
	};

	const dateTimeDisplay = getFullDateWithTime(dateTime);

	return (
		<ScrollView style={styles.container}>
			<Text style={styles.headerTitle}>{title}</Text>

			<Text style={styles.dateTimeText}>{dateTimeDisplay}</Text>

			<Text style={styles.guests}>{`${attendees.length} ${attendees.length === 1 ? 'guest' : 'guests'}`}</Text>

			<Text style={styles.description}>{description}</Text>

			<View style={styles.zoomContainer}>
				<Text style={styles.label}>Meeting Link</Text>
				<Text>{meetingLink}</Text>
			</View>
			<AddToCalendarButton />
			<View style={{ height: 1, backgroundColor: '#E3E3E3', width: '100%', marginBottom: 24 }} />

			<Text style={styles.sectionTitle}>Peer Supporters</Text>
			{peers?.map((peer, index) => (
				<View key={index} style={styles.peerItem}>
					<View style={styles.peerInfo}>
						<Avatar text={peer.username} size={36} borderRadius={18} />
						<Text style={styles.peerName}>{peer.username}</Text>
					</View>
					<View style={styles.iconContainer}>
						<TouchableOpacity style={styles.iconButton} onPress={() => visitPeerProfile(peer)}>
							<CustomIcon name='user' size={25} color='#000' />
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.iconButton, { marginLeft: 10 }]}
							onPress={() => handleCreateDirectMessage(goToRoom, peer)}
						>
							<CustomIcon name='message' size={25} color='#000' />
						</TouchableOpacity>
					</View>
				</View>
			))}
			{isAdmin ? <DoneButton /> : isAttending ? <AttendingButton /> : <RegisterButton />}
			{shouldShowRemoveEventPopup && <RemoveEventPopup eventId={removeEventPopupDetails.id} attendeeId={userName} />}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	headerTitle: {
		fontSize: 24,
		fontWeight: '600',
		color: '#000000',
		marginBottom: 8
	},
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff'
	},
	zoomContainer: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		marginBottom: 24
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
	iconButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#F5F4F2',
		justifyContent: 'center',
		alignItems: 'center'
	},
	iconContainer: {
		flexDirection: 'row',
		alignItems: 'center'
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
	dateTimeText: {
		fontWeight: '200',
		fontSize: 12,
		color: '#494949',
		marginBottom: 24
	},
	sectionTitle: {
		fontSize: 18,
		marginTop: 20,
		marginBottom: 10
	},
	description: {
		fontSize: 16,
		color: '#666',
		marginBottom: 10
	},
	guests: {
		fontSize: 16,
		fontWeight: '500',
		color: '#000000',
		marginBottom: 24
	},
	peerItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
		paddingHorizontal: 10
	},
	peerInfo: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	peerName: {
		marginLeft: 10,
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
	},
	attendingButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#A1AAA1',
		borderRadius: 25,
		padding: 15,
		alignItems: 'center',
		marginTop: 20,
		marginBottom: 20
	},
	attendingButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600'
	},
	addToCalendarButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#E3E3E3',
		borderRadius: 20,
		paddingVertical: 8,
		paddingHorizontal: 16,
		marginBottom: 10
	},
	addToCalendarText: {
		color: '#000',
		fontSize: 16,
		fontWeight: '600'
	}
});

export default EventDetailsView;
