import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, TouchableOpacity, LayoutAnimation, InteractionManager, FlatList, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import ShareExtension from 'react-native-share-extension';
import { connect } from 'react-redux';

import database, { safeAddListener } from '../../lib/realm';
import debounce from '../../utils/debounce';
import { isIOS } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import ShareItem, { ROW_HEIGHT } from '../../presentation/ShareItem';

import styles from './styles';

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

@connect(state => ({
	userId: state.login.user && state.login.user.id,
	token: state.login.user && state.login.user.token,
	baseUrl: state.settings.baseUrl || state.server ? state.server.server : '',
	useRealName: state.settings.UI_Use_Real_Name,
	server: state.server.server,
	connected: state.meteor.connected
}))
/** @extends React.Component */
export default class ShareListView extends React.Component {
	static navigationOptions = () => ({
		headerLeft: (
			<TouchableOpacity style={styles.cancelButton} onPress={() => ShareExtension.close()}>
				<Text style={styles.cancel}>{I18n.t('Cancel')}</Text>
			</TouchableOpacity>
		),
		title: I18n.t('Select_Channels')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		navigation: PropTypes.object,
		server: PropTypes.string,
		connected: PropTypes.bool,
		useRealName: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.data = [];
		this.state = {
			value: '',
			discussions: [],
			channels: [],
			privateGroup: [],
			direct: [],
			livechat: []
		};
	}

	componentWillMount() {
		ShareExtension.data()
			.then(({ value }) => this.setState({ value }));
	}

	componentDidMount() {
		this.getSubscriptions();
	}

	// eslint-disable-next-line react/sort-comp
	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (isIOS && navigation.isFocused()) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	getSubscriptions = debounce(() => {
		if (this.data && this.data.removeAllListeners) {
			this.data.removeAllListeners();
		}

		const {
			server
		} = this.props;

		if (server && this.hasActiveDB()) {
			this.data = database.objects('subscriptions').filtered('archived != true && open == true');
			this.discussions = this.data.filtered('prid != null');
			this.channels = this.data.filtered('t == $0 AND prid == null', 'c');
			this.privateGroup = this.data.filtered('t == $0 AND prid == null', 'p');
			this.direct = this.data.filtered('t == $0 AND prid == null', 'd');
			this.livechat = this.data.filtered('t == $0 AND prid == null', 'l');
			safeAddListener(this.data, this.updateState);
		}
	}, 300);

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.updateStateInteraction = InteractionManager.runAfterInteractions(() => {
			this.internalSetState({
				discussions: this.discussions ? this.discussions.slice() : [],
				channels: this.channels ? this.channels.slice() : [],
				privateGroup: this.privateGroup ? this.privateGroup.slice() : [],
				direct: this.direct ? this.direct.slice() : [],
				livechat: this.livechat ? this.livechat.slice() : []
			});
			this.forceUpdate();
		});
	}, 300);

	// this is necessary during development (enables Cmd + r)
	hasActiveDB = () => database && database.databases && database.databases.activeDB;

	componentWillReceiveProps() {
		this.getSubscriptions();
	}

	getRoomTitle = (item) => {
		const { useRealName } = this.props;
		return ((item.prid || useRealName) && item.fname) || item.name;
	}

	shareMessage = (item) => {
		const { value } = this.state;
		const { navigation } = this.props;

		navigation.navigate('ShareView', {
			rid: item.rid,
			text: value,
			name: this.getRoomTitle(item)
		});
	};

	renderScroll = () => {
		const { connected } = this.props;

		if (!connected) {
			return <ActivityIndicator style={{ flex: 1 }} />;
		}

		return (
			<ScrollView
				style={styles.scroll}
				ref={this.getScrollRef}
				keyboardShouldPersistTaps='always'
				testID='rooms-list-view-list'
			>
				{this.renderScrollView()}
			</ScrollView>
		);
	}

	renderScrollView = () => {
		const {
			discussions, channels, privateGroup, direct, livechat
		} = this.state;

		return (
			<View style={styles.content}>
				{this.renderSection(discussions, 'Discussions')}
				{this.renderSection(channels, 'Channels')}
				{this.renderSection(direct, 'Direct_Messages')}
				{this.renderSection(privateGroup, 'Private_Groups')}
				{this.renderSection(livechat, 'Livechat')}
			</View>
		);
	}

	renderSectionHeader = header => (
		<View
			style={styles.headerContainer}
		>
			<Text
				style={styles.headerText}
			>
				{I18n.t(header)}
			</Text>
		</View>
	);

	renderItem = ({ item }) => {
		const { baseUrl } = this.props;
		if (item.isValid && item.isValid()) {
			return (
				<ShareItem
					baseUrl={baseUrl}
					type={item.t}
					name={this.getRoomTitle(item)}
					onPress={() => this.shareMessage(item)}
				/>
			);
		}
		return null;
	}

	renderSection = (data, header) => {
		if (data && data.length > 0) {
			return (
				<FlatList
					data={data}
					keyExtractor={keyExtractor}
					style={styles.flatlist}
					renderItem={this.renderItem}
					ListHeaderComponent={() => this.renderSectionHeader(header)}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
					initialNumToRender={12}
					windowSize={7}
				/>
			);
		}
		return null;
	}

	render() {
		return (
			<SafeAreaView
				style={styles.container}
				forceInset={{ bottom: 'never' }}
			>
				<StatusBar />
				{this.renderScroll()}
			</SafeAreaView>
		);
	}
}
