import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import I18n from '../i18n';
import Separator from '../containers/Separator';
import ListItem from '../containers/ListItem';
import Status from '../containers/Status/Status';
import TextInput from '../containers/TextInput';
import EventEmitter from '../utils/events';
import Loading from '../containers/Loading';
import RocketChat from '../lib/rocketchat';
import log, { logEvent, events } from '../utils/log';

import { LISTENER } from '../containers/Toast';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { getUserSelector } from '../selectors/login';
import { CustomHeaderButtons, Item, CancelModalButton } from '../containers/HeaderButton';
import store from '../lib/createStore';
import { setUser } from '../actions/login';
import SafeAreaView from '../containers/SafeAreaView';

const STATUS = [{
	id: 'online',
	name: 'Online'
}, {
	id: 'busy',
	name: 'Busy'
}, {
	id: 'away',
	name: 'Away'
}, {
	id: 'offline',
	name: 'Invisible'
}];

const styles = StyleSheet.create({
	status: {
		marginRight: 16
	},
	inputContainer: {
		marginTop: 32,
		marginBottom: 32
	},
	inputLeft: {
		position: 'absolute',
		top: 18,
		left: 14
	},
	inputStyle: {
		paddingLeft: 40
	}
});

class StatusView extends React.Component {
	static propTypes = {
		user: PropTypes.shape({
			id: PropTypes.string,
			status: PropTypes.string,
			statusText: PropTypes.string
		}),
		theme: PropTypes.string,
		navigation: PropTypes.object,
		isMasterDetail: PropTypes.bool
	}

	constructor(props) {
		super(props);

		const { statusText } = props.user;
		this.state = { statusText, loading: false };
		this.setHeader();
	}

	setHeader = () => {
		const { navigation, isMasterDetail } = this.props;
		navigation.setOptions({
			title: I18n.t('Edit_Status'),
			headerLeft: isMasterDetail ? undefined : () => <CancelModalButton onPress={this.close} />,
			headerRight: () => (
				<CustomHeaderButtons>
					<Item
						title={I18n.t('Done')}
						onPress={this.submit}
						testID='status-view-submit'
					/>
				</CustomHeaderButtons>
			)
		});
	}

	submit = async() => {
		logEvent(events.STATUS_DONE);
		const { statusText } = this.state;
		const { user } = this.props;
		if (statusText !== user.statusText) {
			await this.setCustomStatus();
		}
		this.close();
	}

	close = () => {
		const { navigation } = this.props;
		navigation.goBack();
	}

	setCustomStatus = async() => {
		const { statusText } = this.state;
		const { user } = this.props;

		this.setState({ loading: true });

		try {
			const result = await RocketChat.setUserStatus(user.status, statusText);
			if (result.success) {
				logEvent(events.STATUS_CUSTOM);
				EventEmitter.emit(LISTENER, { message: I18n.t('Status_saved_successfully') });
			} else {
				logEvent(events.STATUS_CUSTOM_F);
				EventEmitter.emit(LISTENER, { message: I18n.t('error-could-not-change-status') });
			}
		} catch {
			logEvent(events.STATUS_CUSTOM_F);
			EventEmitter.emit(LISTENER, { message: I18n.t('error-could-not-change-status') });
		}

		this.setState({ loading: false });
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderHeader = () => {
		const { statusText } = this.state;
		const { user, theme } = this.props;

		return (
			<>
				<TextInput
					theme={theme}
					value={statusText}
					containerStyle={styles.inputContainer}
					onChangeText={text => this.setState({ statusText: text })}
					left={(
						<Status
							testID={`status-view-current-${ user.status }`}
							style={styles.inputLeft}
							status={user.status}
							size={12}
						/>
					)}
					inputStyle={styles.inputStyle}
					placeholder={I18n.t('What_are_you_doing_right_now')}
					testID='status-view-input'
				/>
				<Separator theme={theme} />
			</>
		);
	}

	renderItem = ({ item }) => {
		const { statusText } = this.state;
		const { theme, user } = this.props;
		const { id, name } = item;
		return (
			<ListItem
				title={I18n.t(name)}
				onPress={async() => {
					logEvent(events[`STATUS_${ item.id.toUpperCase() }`]);
					if (user.status !== item.id) {
						try {
							const result = await RocketChat.setUserStatus(item.id, statusText);
							if (result.success) {
								store.dispatch(setUser({ status: item.id }));
							}
						} catch (e) {
							logEvent(events.SET_STATUS_FAIL);
							log(e);
						}
					}
				}}
				testID={`status-view-${ id }`}
				left={() => <Status style={styles.status} size={12} status={item.id} />}
				theme={theme}
			/>
		);
	}

	render() {
		const { loading } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView testID='status-view' theme={theme}>
				<FlatList
					data={STATUS}
					keyExtractor={item => item.id}
					contentContainerStyle={{ borderColor: themes[theme].separatorColor }}
					renderItem={this.renderItem}
					ListHeaderComponent={this.renderHeader}
					ListFooterComponent={() => <Separator theme={theme} />}
					ItemSeparatorComponent={this.renderSeparator}
				/>
				<Loading visible={loading} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(StatusView));
