/* eslint-disable no-mixed-spaces-and-tabs */
import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, Text, Alert, Pressable
} from 'react-native';
import { connect } from 'react-redux';
import { HeaderBackButton } from '@react-navigation/stack';
import * as List from '../containers/List';

import Touch from '../utils/touch';
import { leaveRoom as leaveRoomAction } from '../actions/room';
import RocketChat from '../lib/rocketchat';
import sharedStyles from './Styles';
import I18n from '../i18n';
import { CustomIcon } from '../lib/Icons';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import { animateNextTransition } from '../utils/layoutAnimation';
import Loading from '../containers/Loading';

const styles = StyleSheet.create({
	button: {
		height: 46,
		flexDirection: 'row',
		alignItems: 'center'
	},
	buttonIcon: {
		marginLeft: 18,
		marginRight: 16
	},
	buttonText: {
		fontSize: 17,
		...sharedStyles.textRegular
	},
	textContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 15
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center'
	}
});

class SelectListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool,
		leaveRoom: PropTypes.func
	};

	constructor(props) {
		super(props);
		const teamChannels = props.route?.params?.teamChannels;
		this.title = props.route?.params?.title;
		this.teamName = props.route?.params?.teamName;
		this.state = {
			data: teamChannels,
			selected: [],
			loading: false
		};
		this.setHeader();
	}

	setHeader = () => {
		const { navigation, isMasterDetail, theme } = this.props;

		const options = {
			headerShown: true,
			headerTitleAlign: 'center',
			headerTitle: I18n.t(this.title)
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		} else {
			options.headerLeft = () => <HeaderBackButton labelVisible={false} onPress={() => navigation.pop()} tintColor={themes[theme].headerTintColor} />;
		}

		options.headerRight = () => (
			<HeaderButton.Container>
				<HeaderButton.Item title={I18n.t('Next')} onPress={this.submit} testID='select-list-view-submit' />
			</HeaderButton.Container>
		);

		navigation.setOptions(options);
	}

	submit = async() => {
		const { selected } = this.state;
		const { navigation, leaveRoom } = this.props;

		this.setState({ loading: true });
		try {
			// logEvent(events.CT_ADD_ROOM_TO_TEAM);
			const result = await RocketChat.leaveTeam({ teamName: this.teamName });
			if (selected) {
				selected.map(room => leaveRoom(room.rid, room.t));
			}
			if (result.success) {
				this.setState({ loading: false });
				navigation.navigate('RoomsListView');
			}
		} catch (e) {
			// logEvent(events.CT_ADD_ROOM_TO_TEAM_F);
			this.setState({ loading: false });
			Alert.alert(
				I18n.t('Cannot_leave'),
				I18n.t(e.data.error),
				[
					{
						text: 'OK',
						style: 'cancel'
					}
				]
			);
		}
	}

	renderHeader = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].backgroundColor }}>
				<Text style={[styles.buttonText, { color: themes[theme].bodyText, margin: 16 }]}>{I18n.t('Select_Teams')}</Text>
			</View>
		);
	}

	showAlert = () => {
		Alert.alert(
			I18n.t('Cannot_leave'),
			I18n.t('Last_owner_team_room'),
			[
				{
					text: 'OK',
					style: 'cancel'
				}
			]
		);
	}

	leaveChannel = () => {
		const { room } = this.state;
		const { leaveRoom } = this.props;

		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Are_you_sure_you_want_to_leave_the_room', { room: RocketChat.getRoomTitle(room) }),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('leave') }),
					style: 'destructive',
					onPress: () => leaveRoom(room.rid, room.t)
				}
			]
		);
	}

	renderChannel = ({
		onPress, testID, title, icon, checked, alert
	}) => {
		const { theme } = this.props;

		return (
			<Touch
				onPress={onPress}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID={testID}
				theme={theme}
			>
				<View style={[styles.button, { borderColor: themes[theme].separatorColor, marginVertical: 4 }]}>
					<CustomIcon style={[styles.buttonIcon, { color: themes[theme].controlText }]} size={24} name={icon} />
					<View style={styles.textContainer}>
						<Text style={[styles.buttonText, { color: themes[theme].bodyText }]}>{title}</Text>
						{ alert
							? (
								<Pressable onPress={() => this.showAlert()}>
									<CustomIcon style={[styles.buttonIcon, { color: themes[theme].dangerColor, transform: [{ rotateY: '180deg' }] }]} size={24} name={alert} />
								</Pressable>
							) : null}
					</View>
					{checked ? <CustomIcon name={checked} size={22} style={[styles.icon, { color: themes[theme].actionTintColor }]} /> : null}
				</View>
			</Touch>
		);
	}

	isChecked = (rid) => {
		const { selected } = this.state;
		return selected.includes(rid);
	}

	toggleChannel = (rid, roles) => {
		const { selected } = this.state;

		if (roles) {
			this.showAlert();
			return;
		}

		animateNextTransition();
		if (!this.isChecked(rid)) {
			this.setState({ selected: [...selected, rid] }, () => this.setHeader());
		} else {
			const filterSelected = selected.filter(el => el !== rid);
			this.setState({ selected: filterSelected }, () => this.setHeader());
		}
	}

	renderItem = ({ item }) => (
		<>
			{this.renderChannel({
				onPress: () => this.toggleChannel(item.rid, item.roles),
				title: item.name,
				icon: item.t === 'p' ? 'channel-private' : 'channel-public',
				checked: this.isChecked(item.rid, item.roles) ? 'check' : null,
				testID: 'select-list-view-item',
				alert: item.roles ? 'info' : null
			})}
		</>
	)

	renderList = () => {
		const { data } = this.state;
		const { theme } = this.props;

		return (
			<FlatList
				data={data}
				extraData={this.state}
				keyExtractor={item => item._id}
				renderItem={this.renderItem}
				ListHeaderComponent={this.renderHeader}
				ItemSeparatorComponent={List.Separator}
				contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
				keyboardShouldPersistTaps='always'
			/>
		);
	}

	render() {
		const { loading } = this.state;

		return (
			<SafeAreaView testID='new-message-view'>
				<StatusBar />
				{this.renderList()}
				<Loading visible={loading} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail
});

const mapDispatchToProps = dispatch => ({
	leaveRoom: (rid, t) => dispatch(leaveRoomAction(rid, t))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SelectListView));
