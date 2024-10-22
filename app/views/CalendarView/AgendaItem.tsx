import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import isEmpty from 'lodash/isEmpty';
import { parseISO, format } from 'date-fns';

import { CustomIcon } from '../../containers/CustomIcon';
import { getUserSelector } from '../../selectors/login';
import { pressEventRequest } from '../../actions/calendarEvents';
import { IApplicationState } from '../../definitions';
import Avatar from '../../containers/Avatar';
import testIDs from './testIds';

interface ItemProps {
	item: any;
}

const AgendaItem = (props: ItemProps) => {
	const { item } = props;
	const navigation = useNavigation<StackNavigationProp<any>>();
	const dispatch = useDispatch();

	const { username } = useSelector((state: IApplicationState) => getUserSelector(state));
	const { attendees } = item;

	const isAttending = useMemo(() => attendees.includes(username), [attendees, username]);

	const itemPressed = useCallback(
		(item: any) => {
			dispatch(pressEventRequest(item));
			navigation.navigate('EventDetailsView');
		},
		[dispatch, navigation]
	);

	if (isEmpty(item)) {
		return (
			<View style={styles.emptyItem}>
				<Text style={styles.emptyItemText}>No Events Planned Today</Text>
			</View>
		);
	}

	const getFormattedDateTime = (isoDateTime: string) => {
		const date = parseISO(isoDateTime);
		const dayOfWeek = format(date, 'EEEE');
		const time = format(date, 'h:mm a');
		return `${dayOfWeek} at ${time}`;
	};

	const formattedDate = getFormattedDateTime(item.dateTime);
	const fullTitle = `${item.title}${item.meetingLink ? ' (Meeting)' : ''}`;

	return (
		<View style={styles.itemContainer}>
			<TouchableOpacity onPress={() => itemPressed(item)} style={styles.item} testID={testIDs.agenda.ITEM}>
				<View style={styles.contentContainer}>
					<Text style={styles.itemTitleText}>{fullTitle}</Text>
					<Text style={styles.itemDateText}>{formattedDate}</Text>
					{isAttending && (
						<View style={styles.attendingContainer}>
							<CustomIcon name='check' color='white' size={16} />
							<Text style={styles.attendingText}>Attending</Text>
						</View>
					)}
				</View>
				<View style={styles.avatarContainer}>
					<View style={styles.avatarGroup}>
						{item.peers.slice(0, 3).map((user: Record<string, any>, index: number) => (
							<View key={user._id} style={[styles.avatarWrapper, { zIndex: item.peers.length - index, right: index * 15 }]}>
								<Avatar text={user.username} size={36} borderRadius={18} />
							</View>
						))}
					</View>
					{item.peers.length > 3 && (
						<View style={styles.morePeersContainer}>
							<Text style={styles.morePeersText}>{`+${item.peers.length - 3} more`}</Text>
						</View>
					)}
				</View>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	attendingContainer: {
		backgroundColor: '#799A79',
		paddingVertical: 4,
		paddingHorizontal: 8,
		alignItems: 'center',
		flexDirection: 'row',
		alignSelf: 'flex-start',
		marginTop: 4
	},
	morePeersContainer: {
		alignSelf: 'center',
		marginTop: 4
	},
	morePeersText: {
		color: 'grey',
		fontSize: 12
	},
	attendingText: {
		color: 'white',
		fontSize: 12,
		fontWeight: 'bold'
	},
	avatarContainer: {
		flexDirection: 'column',
		marginLeft: 10
	},
	avatarGroup: {
		flexDirection: 'row-reverse'
	},
	avatarWrapper: {
		position: 'relative',
		marginLeft: -2,
		borderWidth: 2,
		borderColor: 'white',
		borderRadius: 18,
		overflow: 'hidden',
		width: 36,
		height: 36,
		justifyContent: 'center',
		alignItems: 'center'
	},
	itemContainer: {
		paddingBottom: 8,
		backgroundColor: '#F5F4F2'
	},
	item: {
		padding: 20,
		backgroundColor: 'white',
		flexDirection: 'row',

		borderRadius: 20,
		left: 15,
		width: '90%'
	},
	contentContainer: {
		flex: 1
	},
	itemTitleText: {
		color: 'black',
		fontWeight: 'bold',
		fontSize: 16
	},
	itemDateText: {
		color: 'grey',
		fontSize: 14,
		marginTop: 4
	},
	emptyItem: {
		paddingLeft: 20,
		height: 52,
		justifyContent: 'center',
		borderBottomWidth: 1,
		borderBottomColor: 'lightgrey'
	},
	emptyItemText: {
		color: 'lightgrey',
		fontSize: 14
	}
});

export default React.memo(AgendaItem);
