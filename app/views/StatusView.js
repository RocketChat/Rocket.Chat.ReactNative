import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';

import I18n from '../i18n';
import Separator from '../containers/Separator';
import ListItem from '../containers/ListItem';
import Status from '../containers/Status/Status';
import TextInput from '../containers/TextInput';
import EventEmitter from '../utils/events';
import Loading from '../containers/Loading';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';

import { LISTENER } from '../containers/Toast';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { withSplit } from '../split';
import { themedHeader } from '../utils/navigation';
import { getUserSelector } from '../selectors/login';
import { CustomHeaderButtons, Item, CancelModalButton } from '../containers/HeaderButton';
import store from '../lib/createStore';
import { setUser } from '../actions/login';

const STATUS = [{
	id: 'online',
	name: I18n.t('Online')
}, {
	id: 'busy',
	name: I18n.t('Busy')
}, {
	id: 'away',
	name: I18n.t('Away')
}, {
	id: 'offline',
	name: I18n.t('Invisible')
}];

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
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
	static navigationOptions = ({ navigation, screenProps }) => ({
		title: I18n.t('Edit_Status'),
		headerLeft: <CancelModalButton onPress={navigation.getParam('close', () => {})} />,
		headerRight: (
			<CustomHeaderButtons>
				<Item
					title={I18n.t('Done')}
					onPress={navigation.getParam('submit', () => {})}
					testID='status-view-submit'
				/>
			</CustomHeaderButtons>
		),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		user: PropTypes.shape({
			id: PropTypes.string,
			status: PropTypes.string,
			statusText: PropTypes.string
		}),
		theme: PropTypes.string,
		split: PropTypes.bool,
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);

		const { statusText } = props.user;
		this.state = { statusText, loading: false };

		props.navigation.setParams({ submit: this.submit, close: this.close });
	}

	submit = async() => {
		const { statusText } = this.state;
		const { user } = this.props;
		if (statusText !== user.statusText) {
			await this.setCustomStatus();
		}
		this.close();
	}

	close = () => {
		const { navigation, split } = this.props;
		if (split) {
			navigation.goBack();
		} else {
			navigation.pop();
		}
	}

	setCustomStatus = async() => {
		const { statusText } = this.state;
		const { user } = this.props;

		this.setState({ loading: true });

		try {
			const result = await RocketChat.setUserStatus(user.status, statusText);
			if (result.success) {
				EventEmitter.emit(LISTENER, { message: I18n.t('Status_saved_successfully') });
			} else {
				EventEmitter.emit(LISTENER, { message: I18n.t('error-could-not-change-status') });
			}
		} catch {
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
				title={name}
				onPress={async() => {
					if (user.status !== item.id) {
						try {
							const result = await RocketChat.setUserStatus(item.id, statusText);
							if (result.success) {
								store.dispatch(setUser({ status: item.id }));
							}
						} catch (e) {
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
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: themes[theme].auxiliaryBackground }
				]}
				forceInset={{ vertical: 'never' }}
				testID='status-view'
			>
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
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withSplit(withTheme(StatusView)));
