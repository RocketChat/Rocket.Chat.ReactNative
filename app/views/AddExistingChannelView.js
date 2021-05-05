/* eslint-disable no-mixed-spaces-and-tabs */
import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, Text
} from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { HeaderBackButton } from '@react-navigation/stack';
import * as List from '../containers/List';

import Touch from '../utils/touch';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import sharedStyles from './Styles';
import I18n from '../i18n';
import log from '../utils/log';
import SearchBox from '../containers/SearchBox';
import { CustomIcon } from '../lib/Icons';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import { animateNextTransition } from '../utils/layoutAnimation';
import { goRoom } from '../utils/goRoom';
import Loading from '../containers/Loading';

const QUERY_SIZE = 15;

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
		flexDirection: 'column',
		justifyContent: 'center',
		marginRight: 15
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center'
	}
});

class AddExistingChannelView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool
	};

	constructor(props) {
		super(props);
		this.init();
		this.teamId = props.route?.params?.teamId;
		this.state = {
			search: [],
			channels: [],
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
			headerTitle: I18n.t('Add_Existing_Channel')
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		} else {
			options.headerLeft = () => <HeaderBackButton labelVisible={false} onPress={() => navigation.pop()} tintColor={themes[theme].headerTintColor} />;
		}

		options.headerRight = () => selected.length > 0 && (
			<HeaderButton.Container>
				<HeaderButton.Item title={I18n.t('Create')} onPress={this.submit} testID='add-existing-channel-view-submit' />
			</HeaderButton.Container>
		);

		navigation.setOptions(options);
	}

	// eslint-disable-next-line react/sort-comp
	init = async() => {
		try {
			const db = database.active;
			const channels = await db.collections
				.get('subscriptions')
				.query(
					Q.where('t', 'p'),
					Q.where('team_id', ''),
					Q.experimentalTake(QUERY_SIZE),
					Q.experimentalSortBy('room_updated_at', Q.desc)
				)
				.fetch();
			this.setState({ channels });
		} catch (e) {
			log(e);
		}
	}

	onSearchChangeText(text) {
		this.search(text);
	}

	dismiss = () => {
		const { navigation } = this.props;
		return navigation.pop();
	}

	search = async(text) => {
		const result = await RocketChat.search({ text, filterUsers: false });
		this.setState({
			search: result
		});
	}

	submit = async() => {
		const { selected } = this.state;
		const { isMasterDetail } = this.props;

		this.setState({ loading: true });
		try {
			// TODO: Log request
			const result = await RocketChat.addTeamRooms({ rooms: selected, teamId: this.teamId });
			if (result.success) {
				this.setState({ loading: false });
				goRoom({ item: result, isMasterDetail });
			}
		} catch (e) {
			// TODO: Log error
			this.setState({ loading: false });
		}
	}

	renderChannel = ({
		onPress, testID, title, icon, checked
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
					</View>
					{checked ? <CustomIcon name={checked} size={22} style={[styles.icon, { color: themes[theme].actionTintColor }]} /> : null}
				</View>
			</Touch>
		);
	}

	renderHeader = () => {
		const { theme } = this.props;
		return (
			<View style={{ backgroundColor: themes[theme].auxiliaryBackground }}>
				<SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='add-existing-channel-view-search' />
			</View>
		);
	}

	isChecked = (rid) => {
		const { selected } = this.state;
		return selected.includes(rid);
	}

	toggleChannel = (rid) => {
		const { selected } = this.state;

		animateNextTransition();
		if (!this.isChecked(rid)) {
			// logEvent(events.SELECTED_USERS_ADD_USER);
			this.setState({ selected: [...selected, rid] }, () => this.setHeader());
		} else {
			// logEvent(events.SELECTED_USERS_REMOVE_USER);
			const filterSelected = selected.filter(el => el !== rid);
			this.setState({ selected: filterSelected }, () => this.setHeader());
		}
	}

	renderItem = ({ item }) => (
		<>
			{this.renderChannel({
				onPress: () => this.toggleChannel(item.rid),
				title: item.name,
				icon: item.t === 'p' && !item.teamId ? 'channel-private' : 'channel-public',
				checked: this.isChecked(item.rid) ? 'check' : null,
				testID: 'add-existing-channel-view-item'
			})}
		</>
	)

	renderList = () => {
		const { search, channels } = this.state;
		const { theme } = this.props;
		return (
			<FlatList
				data={search.length > 0 ? search : channels}
				extraData={this.state}
				keyExtractor={item => item._id}
				ListHeaderComponent={this.renderHeader}
				renderItem={this.renderItem}
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

export default connect(mapStateToProps, null)(withTheme(AddExistingChannelView));
