/* eslint-disable no-mixed-spaces-and-tabs */
import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, Text, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { HeaderBackButton } from '@react-navigation/stack';
import * as List from '../containers/List';

import { leaveRoom as leaveRoomAction } from '../actions/room';
import RocketChat from '../lib/rocketchat';
import sharedStyles from './Styles';
import I18n from '../i18n';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import { animateNextTransition } from '../utils/layoutAnimation';
import Loading from '../containers/Loading';

const styles = StyleSheet.create({
	buttonText: {
		fontSize: 17,
		margin: 16,
		...sharedStyles.textRegular
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
		const data = props.route?.params?.data;
		this.title = props.route?.params?.title;
		this.teamName = props.route?.params?.teamName;
		this.nextAction = props.route?.params?.nextAction;
		this.state = {
			data,
			selected: [],
			loading: false
		};
		this.setHeader();
	}

	setHeader = () => {
		const { navigation, isMasterDetail, theme } = this.props;
		const { selected } = this.state;

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
				<HeaderButton.Item title={I18n.t('Next')} onPress={() => this.nextAction(selected)} testID='select-list-view-submit' />
			</HeaderButton.Container>
		);

		navigation.setOptions(options);
	}

	renderHeader = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].backgroundColor }}>
				<Text style={[styles.buttonText, { color: themes[theme].bodyText }]}>{I18n.t('Select_Teams')}</Text>
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

	renderItem = ({ item }) => {
		const { theme } = this.props;
		const alert = item.roles ? 'info' : null;
		const icon = item.t === 'p' ? 'channel-private' : 'channel-public';
		const checked = this.isChecked(item.rid, item.roles) ? 'check' : null;

		return (
			<>
				<List.Item
					title={item.name}
					translateTitle={false}
					testID={`select-list-view-item-${ item.name }`}
					onPress={() => (alert ? this.showAlert() : this.toggleChannel(item.rid, item.roles))}
					alert={alert}
					left={() => <List.Icon name={icon} color={themes[theme].controlText} />}
					right={() => (checked ? <List.Icon name={checked} color={themes[theme].actionTintColor} /> : null)}
				/>
			</>
		);
	}

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
