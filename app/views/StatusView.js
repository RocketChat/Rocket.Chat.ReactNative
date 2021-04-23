import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import I18n from '../i18n';
import * as List from '../containers/List';
import Status from '../containers/Status/Status';
import TextInput from '../containers/TextInput';
import EventEmitter from '../utils/events';
import Loading from '../containers/Loading';
import RocketChat from '../lib/rocketchat';
import log, { logEvent, events } from '../utils/log';

import { LISTENER } from '../containers/Toast';
import { withTheme } from '../theme';
import { getUserSelector } from '../selectors/login';
import * as HeaderButton from '../containers/HeaderButton';
import { setUser as setUserAction } from '../actions/login';
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
	inputContainer: {
		marginTop: 32,
		marginBottom: 32
	},
	inputLeft: {
		position: 'absolute',
		top: 12,
		left: 12
	},
	inputStyle: {
		paddingLeft: 48
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
		isMasterDetail: PropTypes.bool,
		setUser: PropTypes.func
	}

	constructor(props) {
		super(props);

		const { statusText } = props.user;
		this.state = { statusText: statusText || '', loading: false };
		this.setHeader();
	}

	setHeader = () => {
		const { navigation, isMasterDetail } = this.props;
		navigation.setOptions({
			title: I18n.t('Edit_Status'),
			headerLeft: isMasterDetail ? undefined : () => <HeaderButton.CancelModal onPress={this.close} />,
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						title={I18n.t('Done')}
						onPress={this.submit}
						testID='status-view-submit'
					/>
				</HeaderButton.Container>
			)
		});
	}

	submit = async() => {
		logEvent(events.STATUS_DONE);
		const { statusText } = this.state;
		const { user } = this.props;
		if (statusText !== user.statusText) {
			await this.setCustomStatus(statusText);
		}
		this.close();
	}

	close = () => {
		const { navigation } = this.props;
		navigation.goBack();
	}

	setCustomStatus = async(statusText) => {
		const { user, setUser } = this.props;

		this.setState({ loading: true });

		try {
			const result = await RocketChat.setUserStatus(user.status, statusText);
			if (result.success) {
				logEvent(events.STATUS_CUSTOM);
				setUser({ statusText });
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
							size={24}
						/>
					)}
					inputStyle={styles.inputStyle}
					placeholder={I18n.t('What_are_you_doing_right_now')}
					testID='status-view-input'
				/>
				<List.Separator />
			</>
		);
	}

	renderItem = ({ item }) => {
		const { statusText } = this.state;
		const { user, setUser } = this.props;
		const { id, name } = item;
		return (
			<List.Item
				title={name}
				onPress={async() => {
					logEvent(events[`STATUS_${ item.id.toUpperCase() }`]);
					if (user.status !== item.id) {
						try {
							const result = await RocketChat.setUserStatus(item.id, statusText);
							if (result.success) {
								setUser({ status: item.id });
							}
						} catch (e) {
							logEvent(events.SET_STATUS_FAIL);
							log(e);
						}
					}
				}}
				testID={`status-view-${ id }`}
				left={() => <Status size={24} status={item.id} />}
			/>
		);
	}

	render() {
		const { loading } = this.state;
		return (
			<SafeAreaView testID='status-view'>
				<FlatList
					data={STATUS}
					keyExtractor={item => item.id}
					renderItem={this.renderItem}
					ListHeaderComponent={this.renderHeader}
					ListFooterComponent={List.Separator}
					ItemSeparatorComponent={List.Separator}
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

const mapDispatchToProps = dispatch => ({
	setUser: user => dispatch(setUserAction(user))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(StatusView));
