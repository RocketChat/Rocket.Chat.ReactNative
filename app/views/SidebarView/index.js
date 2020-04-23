import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, Text, View, SafeAreaView
} from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import Avatar from '../../containers/Avatar';
import Status from '../../containers/Status/Status';
import log from '../../utils/log';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import SidebarItem from './SidebarItem';
import { themes } from '../../constants/colors';
import database from '../../lib/database';
import { withTheme } from '../../theme';
import { withSplit } from '../../split';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/Navigation';

const Separator = React.memo(({ theme }) => <View style={[styles.separator, { borderColor: themes[theme].separatorColor }]} />);
Separator.propTypes = {
	theme: PropTypes.string
};

const permissions = [
	'view-statistics',
	'view-room-administration',
	'view-user-administration',
	'view-privileged-setting'
];

class Sidebar extends Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		Site_Name: PropTypes.string.isRequired,
		user: PropTypes.object,
		activeItemKey: PropTypes.string,
		theme: PropTypes.string,
		loadingServer: PropTypes.bool,
		useRealName: PropTypes.bool,
		allowStatusMessage: PropTypes.bool,
		split: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.state = {
			showStatus: false,
			isAdmin: false
		};
	}

	componentDidMount() {
		this.setIsAdmin();
	}

	componentWillReceiveProps(nextProps) {
		const { loadingServer } = this.props;
		if (loadingServer && nextProps.loadingServer !== loadingServer) {
			this.setIsAdmin();
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { showStatus, isAdmin } = this.state;
		const {
			Site_Name, user, baseUrl, activeItemKey, split, useRealName, theme
		} = this.props;
		if (nextState.showStatus !== showStatus) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (nextProps.baseUrl !== baseUrl) {
			return true;
		}
		if (nextProps.activeItemKey !== activeItemKey) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.user && user) {
			if (nextProps.user.language !== user.language) {
				return true;
			}
			if (nextProps.user.status !== user.status) {
				return true;
			}
			if (nextProps.user.username !== user.username) {
				return true;
			}
			if (nextProps.user.statusText !== user.statusText) {
				return true;
			}
		}
		if (nextProps.split !== split) {
			return true;
		}
		if (nextProps.useRealName !== useRealName) {
			return true;
		}
		if (nextState.isAdmin !== isAdmin) {
			return true;
		}
		return false;
	}

	async setIsAdmin() {
		const db = database.active;
		const { user } = this.props;
		const { roles } = user;
		try {
			if	(roles) {
				const permissionsCollection = db.collections.get('permissions');
				const permissionsFiltered = await permissionsCollection.query(Q.where('id', Q.oneOf(permissions))).fetch();
				const isAdmin = permissionsFiltered.reduce((result, permission) => (
					result || permission.roles.some(r => roles.indexOf(r) !== -1)),
				false);
				this.setState({ isAdmin });
			}
		} catch (e) {
			log(e);
		}
	}

	sidebarNavigate = (route) => {
		const { navigation } = this.props;
		navigation.navigate(route);
	}

	renderNavigation = () => {
		const { isAdmin } = this.state;
		const { activeItemKey, theme } = this.props;
		return (
			<>
				<SidebarItem
					text={I18n.t('Chats')}
					left={<CustomIcon name='message' size={20} color={themes[theme].titleText} />}
					onPress={() => this.sidebarNavigate('RoomsListView')}
					testID='sidebar-chats'
					current={activeItemKey === 'ChatsStack'}
				/>
				<SidebarItem
					text={I18n.t('Profile')}
					left={<CustomIcon name='user' size={20} color={themes[theme].titleText} />}
					onPress={() => this.sidebarNavigate('ProfileView')}
					testID='sidebar-profile'
					current={activeItemKey === 'ProfileStack'}
				/>
				<SidebarItem
					text={I18n.t('Settings')}
					left={<CustomIcon name='cog' size={20} color={themes[theme].titleText} />}
					onPress={() => this.sidebarNavigate('SettingsView')}
					testID='sidebar-settings'
					current={activeItemKey === 'SettingsStack'}
				/>
				{isAdmin ? (
					<SidebarItem
						text={I18n.t('Admin_Panel')}
						left={<CustomIcon name='shield-alt' size={20} color={themes[theme].titleText} />}
						onPress={() => this.sidebarNavigate('AdminPanelView')}
						testID='sidebar-settings'
						current={activeItemKey === 'AdminPanelStack'}
					/>
				) : null}
			</>
		);
	}

	renderCustomStatus = () => {
		const { user, theme } = this.props;
		return (
			<SidebarItem
				text={user.statusText || I18n.t('Edit_Status')}
				left={<Status style={styles.status} size={12} status={user && user.status} />}
				right={<CustomIcon name='edit' size={20} color={themes[theme].titleText} />}
				onPress={() => Navigation.navigate('StatusView')}
				testID='sidebar-custom-status'
			/>
		);
	}

	render() {
		const {
			user, Site_Name, baseUrl, useRealName, allowStatusMessage, split, theme
		} = this.props;

		if (!user) {
			return null;
		}
		return (
			<SafeAreaView testID='sidebar-view' style={[styles.container, { backgroundColor: themes[theme].focusedBackground }]}>
				<ScrollView
					style={[
						styles.container,
						{
							backgroundColor: split
								? themes[theme].backgroundColor
								: themes[theme].focusedBackground
						}
					]}
					{...scrollPersistTaps}
				>
					<View style={styles.header} theme={theme}>
						<Avatar
							text={user.username}
							size={30}
							style={styles.avatar}
							baseUrl={baseUrl}
							userId={user.id}
							token={user.token}
						/>
						<View style={styles.headerTextContainer}>
							<View style={styles.headerUsername}>
								<Text numberOfLines={1} style={[styles.username, { color: themes[theme].titleText }]}>{useRealName ? user.name : user.username}</Text>
							</View>
							<Text style={[styles.currentServerText, { color: themes[theme].titleText }]} numberOfLines={1}>{Site_Name}</Text>
						</View>
					</View>

					<Separator theme={theme} />

					{allowStatusMessage ? this.renderCustomStatus() : null}
					{!split ? (
						<>
							<Separator theme={theme} />
							{this.renderNavigation()}
							<Separator theme={theme} />
						</>
					) : null}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	Site_Name: state.settings.Site_Name,
	user: getUserSelector(state),
	baseUrl: state.server.server,
	loadingServer: state.server.loading,
	useRealName: state.settings.UI_Use_Real_Name,
	allowStatusMessage: state.settings.Accounts_AllowUserStatusMessageChange
});

export default connect(mapStateToProps)(withTheme(withSplit(Sidebar)));
