import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, TouchableOpacity, LayoutAnimation, InteractionManager, FlatList, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import ShareExtension from 'rn-extensions-share';
import { connect } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import * as mime from 'react-native-mime-types';

import Navigation from '../../lib/Navigation';
import database, { safeAddListener } from '../../lib/realm';
import debounce from '../../utils/debounce';
import { isIOS } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import ShareItem, { ROW_HEIGHT } from '../../presentation/ShareItem';
import { CustomIcon } from '../../lib/Icons';
import log from '../../utils/log';

import styles from './styles';
import ServerItem from '../../presentation/ServerItem';

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

@connect(state => ({
	userId: state.login.user && state.login.user.id,
	token: state.login.user && state.login.user.token,
	useRealName: state.settings.UI_Use_Real_Name,
	server: state.server.server,
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize
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
		navigation: PropTypes.object,
		server: PropTypes.string,
		useRealName: PropTypes.bool,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number
	}

	constructor(props) {
		super(props);
		this.data = [];
		this.state = {
			value: '',
			isMedia: false,
			mediaLoading: false,
			fileInfo: null,
			discussions: [],
			channels: [],
			privateGroup: [],
			direct: [],
			livechat: [],
			servers: []
		};
	}

	async componentDidMount() {
		this.getSubscriptions();
		try {
			const { value, type } = await ShareExtension.data();
			let fileInfo = null;
			const isMedia = (type === 'media');
			if (isMedia) {
				this.setState({ mediaLoading: true });
				const data = await RNFetchBlob.fs.stat(this.uriToPath(value));
				fileInfo = {
					name: data.filename,
					description: '',
					size: data.size,
					type: mime.lookup(data.path),
					store: 'Uploads',
					path: data.path
				};
			}
			this.setState({
				value, fileInfo, isMedia, mediaLoading: false
			});
		} catch (e) {
			log('err_process_media_share_extension', e);
			this.setState({ mediaLoading: false });
		}
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

		const { serversDB } = database.databases;
		const { server } = this.props;

		if (server && this.hasActiveDB()) {
			this.data = database.objects('subscriptions').filtered('archived != true && open == true');
			this.discussions = this.data.filtered('prid != null');
			this.channels = this.data.filtered('t == $0 AND prid == null', 'c');
			this.privateGroup = this.data.filtered('t == $0 AND prid == null', 'p');
			this.direct = this.data.filtered('t == $0 AND prid == null', 'd');
			this.livechat = this.data.filtered('t == $0 AND prid == null', 'l');
			this.servers = serversDB.objects('servers');
			safeAddListener(this.data, this.updateState);
		}
	}, 300);

	uriToPath = uri => decodeURIComponent(uri.replace(/^file:\/\//, ''));

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.updateStateInteraction = InteractionManager.runAfterInteractions(() => {
			this.internalSetState({
				discussions: this.discussions ? this.discussions.slice() : [],
				channels: this.channels ? this.channels.slice() : [],
				privateGroup: this.privateGroup ? this.privateGroup.slice() : [],
				direct: this.direct ? this.direct.slice() : [],
				livechat: this.livechat ? this.livechat.slice() : [],
				servers: this.servers ? this.servers.slice() : []
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
		const { value, isMedia, fileInfo } = this.state;
		const { navigation } = this.props;

		navigation.navigate('ShareView', {
			rid: item.rid,
			value,
			isMedia,
			fileInfo,
			name: this.getRoomTitle(item)
		});
	};

	canUploadFile = () => {
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = this.props;
		const { fileInfo: file } = this.state;

		if (!(file && file.path)) {
			return true;
		}
		if (file.size > FileUpload_MaxFileSize) {
			return false;
		}
		if (!FileUpload_MediaTypeWhiteList) {
			return false;
		}
		const allowedMime = FileUpload_MediaTypeWhiteList.split(',');
		if (allowedMime.includes(file.type)) {
			return true;
		}
		const wildCardGlob = '/*';
		const wildCards = allowedMime.filter(item => item.indexOf(wildCardGlob) > 0);
		if (wildCards.includes(file.type.replace(/(\/.*)$/, wildCardGlob))) {
			return true;
		}
		return false;
	}

	renderScrollView = () => {
		const { mediaLoading } = this.state;
		if (!(this.data && this.data.length > 0) || mediaLoading) {
			return <ActivityIndicator style={styles.loading} />;
		}

		return (
			<ScrollView
				style={styles.scroll}
				keyboardShouldPersistTaps='always'
				testID='rooms-list-view-list'
			>
				{this.renderContent()}
			</ScrollView>
		);
	}

	renderContent = () => {
		const {
			discussions, channels, privateGroup, direct, livechat
		} = this.state;

		return (
			<View style={styles.content}>
				{this.renderServerSelector()}
				{this.renderSection(discussions, 'Discussions')}
				{this.renderSection(channels, 'Channels')}
				{this.renderSection(direct, 'Direct_Messages')}
				{this.renderSection(privateGroup, 'Private_Groups')}
				{this.renderSection(livechat, 'Livechat')}
			</View>
		);
	}

	renderSectionHeader = header => (
		<View style={styles.headerContainer}>
			<Text style={styles.headerText}>
				{I18n.t(header)}
			</Text>
		</View>
	);

	renderItem = ({ item }) => {
		if (item.isValid && item.isValid()) {
			return (
				<ShareItem
					type={item.t}
					name={this.getRoomTitle(item)}
					onPress={() => this.shareMessage(item)}
				/>
			);
		}
		return null;
	}

	renderSeparator = () => <View style={styles.separator} />;

	renderSection = (data, header) => {
		if (data && data.length > 0) {
			return (
				<View>
					{this.renderSectionHeader(header)}
					<View style={styles.bordered}>
						<FlatList
							data={data}
							keyExtractor={keyExtractor}
							style={styles.flatlist}
							renderItem={this.renderItem}
							ItemSeparatorComponent={this.renderSeparator}
							getItemLayout={getItemLayout}
							enableEmptySections
							removeClippedSubviews
							keyboardShouldPersistTaps='always'
							initialNumToRender={12}
							windowSize={7}
						/>
					</View>
				</View>
			);
		}
		return null;
	}

	renderServerSelector = () => {
		const { servers } = this.state;
		const { server } = this.props;
		const currentServer = servers.find(serverFiltered => serverFiltered.id === server);
		return currentServer ? (
			<View>
				{this.renderSectionHeader('Select_Server')}
				<View style={styles.bordered}>
					<ServerItem
						onPress={() => Navigation.navigate('SelectServerView')}
						item={currentServer}
						disclosure
					/>
				</View>
			</View>
		) : null;
	};

	renderError = () => {
		const { FileUpload_MaxFileSize } = this.props;
		const { fileInfo: file } = this.state;
		const errorMessage = (FileUpload_MaxFileSize < file.size)
			? 'error-file-too-large'
			: 'error-invalid-file-type';
		return (
			<View style={[styles.container]}>
				<View>
					<Text style={styles.title}>{I18n.t(errorMessage)}</Text>
				</View>
				<View>
					<CustomIcon name='circle-cross' size={120} style={styles.errorIcon} />
				</View>
				<Text style={styles.fileMime}>{ file.type }</Text>
			</View>
		);
	}

	render() {
		const showError = !this.canUploadFile();
		return (
			<SafeAreaView
				style={styles.container}
				forceInset={{ bottom: 'never' }}
			>
				<StatusBar />
				{ showError ? this.renderError() : this.renderScrollView() }
			</SafeAreaView>
		);
	}
}
