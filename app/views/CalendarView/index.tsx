import React, { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExpandableCalendar, AgendaList, CalendarProvider } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Touchable from 'react-native-platform-touchable';
import { useDispatch, useSelector } from 'react-redux';

import { useTheme } from '../../theme';
import { createEventDraft, fetchEventRequest } from '../../actions/calendarEvents';
import { getUserSelector } from '../../selectors/login';
import { getFetchedEventsSelector, getPopupSelector } from '../../selectors/event';
import { IApplicationState } from '../../definitions';
import StatusBar from '../../containers/StatusBar';
import Avatar from '../../containers/Avatar';
import * as HeaderButton from '../../containers/HeaderButton';
import AgendaItem from './AgendaItem';
import testIDs from './testIds';
import { getMarkedDates } from './helpers';
import ConfirmationPopup from './ConfirmationPopup';

const CalendarView = (): React.ReactElement => {
	const dispatch = useDispatch();
	const theme = useTheme();
	const { colors } = theme;
	const navigation = useNavigation<StackNavigationProp<any>>();
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const userName = user?.username || '';
	const isAdmin = user?.roles && user?.roles.includes('admin');

	const agendaItems = useSelector((state: IApplicationState) => getFetchedEventsSelector(state));

	const marked = getMarkedDates(agendaItems ?? []);

	const { shouldShowConfirmationPopup, confirmationPopupDetails } = useSelector((state: IApplicationState) =>
		getPopupSelector(state)
	);

	const styles = makeStyles(theme);

	useEffect(() => {
		navigation.setOptions({ title: '', headerStyle: { shadowColor: 'transparent' } });
		navigation.setOptions({
			headerLeft: () => <HeaderButton.Drawer navigation={navigation} testID='calendar-view-drawer' />,
			headerRight: () => (
				<HeaderButton.Container>
					<Touchable style={{ marginRight: 20 }} onPress={() => navigation.navigate('ProfileView')}>
						{userName ? <Avatar text={userName} size={24} borderRadius={12} /> : <></>}
					</Touchable>
				</HeaderButton.Container>
			)
		});

		dispatch(fetchEventRequest());
	}, [navigation, userName, dispatch]);

	const createEvent = useCallback(() => {
		dispatch(createEventDraft({ author: userName }));
		navigation.navigate('CreateEventView');
	}, [dispatch, navigation, userName]);

	const renderItem = useCallback(({ item }: any) => <AgendaItem item={item} />, []);

	const todaysDate = useMemo(() => new Date().toISOString().split('T')[0], []);

	return (
		<View style={{ flex: 1, backgroundColor: colors.backgroundColor }} testID='calendar-view'>
			<StatusBar />
			<ScrollView style={{ flex: 1 }}>
				<Text style={styles.title}>Calendar</Text>
				<CalendarProvider date={todaysDate}>
					<ExpandableCalendar
						testID={testIDs.expandableCalendar.CONTAINER}
						theme={{ ...theme, dotColor: '#CB007B', arrowColor: '#CB007B', selectedDayBackgroundColor: '#799A79' }}
						firstDay={0}
						markedDates={marked}
					/>
					<AgendaList
						sections={agendaItems ?? []}
						renderItem={renderItem}
						sectionStyle={{
							backgroundColor: '#F5F4F2'
						}}
					/>
				</CalendarProvider>
				{shouldShowConfirmationPopup && <ConfirmationPopup event={confirmationPopupDetails} userName={userName} />}
				{isAdmin && (
					<View style={styles.adminButtonContainer}>
						<Touchable style={styles.adminButton} onPress={() => createEvent()}>
							<Text style={styles.adminButtonText}>Create event</Text>
						</Touchable>
					</View>
				)}
			</ScrollView>
		</View>
	);
};

const makeStyles = (theme: any) =>
	StyleSheet.create({
		title: {
			color: theme.colors.titleText,
			marginLeft: 20,
			marginBottom: 10,
			fontSize: 24,
			lineHeight: 29,
			fontWeight: '600'
		},
		tileContainer: {
			flexDirection: 'row',
			justifyContent: 'space-around',
			flexWrap: 'wrap'
		},
		adminButtonContainer: {
			marginTop: 20,
			bottom: 20,
			width: '100%',
			backgroundColor: '#F5F4F2'
		},
		adminButton: {
			margin: 10,
			backgroundColor: '#799A79',
			paddingVertical: 15,
			paddingHorizontal: 20,
			borderRadius: 20,
			alignItems: 'center',
			justifyContent: 'center'
		},
		adminButtonText: {
			color: 'white',
			fontSize: 20,
			fontWeight: 'bold'
		}
	});

export default CalendarView;
