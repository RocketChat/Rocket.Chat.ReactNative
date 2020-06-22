import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, NativeModules } from 'react-native';
import { connect } from 'react-redux';
import ShareExtension from 'rn-extensions-share';
import * as VideoThumbnails from 'expo-video-thumbnails';

import { themes } from '../../constants/colors';
import I18n from '../../i18n';
import styles from './styles';
import Loading from '../../containers/Loading';
import {
	Item,
	CloseModalButton,
	CustomHeaderButtons
} from '../../containers/HeaderButton';
import { isBlocked } from '../../utils/room';
import { isReadOnly } from '../../utils/isReadOnly';
import { withTheme } from '../../theme';
import Header from './Header';
import RocketChat from '../../lib/rocketchat';
import TextInput from '../../containers/TextInput';
import Preview from './Preview';
import Thumbs from './Thumbs';
import MessageBox from '../../containers/MessageBox';
import SafeAreaView from '../../containers/SafeAreaView';
import debounce from '../../utils/debounce';
import { getUserSelector } from '../../selectors/login';
import StatusBar from '../../containers/StatusBar';

class ShareView extends Component {
	constructor(props) {
		super(props);
		this.files = props.route.params?.attachments ?? [];
		this.shareExtension = props.route.params?.shareExtension;

		this.state = {
			selected: 0,
			loading: false,
			loadingPreview: true,
			readOnly: false,
			attachments: [],
			text: props.route.params?.text ?? '',
			room: props.route.params?.room ?? {} // TODO: query room?
		};
		this.unsubscribeFocus = props.navigation.addListener('focus', this.didFocus);
	}

	componentDidMount = () => {
		// (async() => {
		// 	try {
		// 		const ro = await isReadOnly(room, { username });
		// 		setReadOnly(ro);
		// 	} catch {
		// 		// Do nothing
		// 	}
		// })();

		this.setAttachments();
		this.setHeader();
	}

	componentWillUnmount = () => {
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	didFocus = () => {
		this.setState({ loadingPreview: false });
	}

	setAttachments = async() => {
		// set attachments just when it was mounted to prevent memory issues
		// get video thumbnails
		const items = await Promise.all(this.files.map(async(item) => {
			if (item.mime?.match(/video/)) {
				try {
					const { uri } = await VideoThumbnails.getThumbnailAsync(item.path);
					item.uri = uri;
				} catch {
					// Do nothing
				}
				return item;
			}
			return item;
		}));
		this.setState({ attachments: items });
	}

	send = async() => {
		const {
			loading, attachments, room, text
		} = this.state;
		const { navigation, server, user } = this.props;
		if (loading) {
			return;
		}

		// if it's share extension this should show loading
		if (this.shareExtension) {
			this.setState({ loading: true });

		// if it's not share extension this can close
		} else {
			navigation.pop();
		}

		try {
			// Send attachment
			if (attachments.length) {
				await Promise.all(attachments.map(({
					filename: name,
					mime: type,
					description,
					size,
					path
				}) => RocketChat.sendFileMessage(
					room.rid,
					{
						name,
						description,
						size,
						type,
						path,
						store: 'Uploads'
					},
					undefined,
					server,
					{ id: user.id, token: user.token }
				)));

			// Send text message
			} else if (text.length) {
				await RocketChat.sendMessage(room.rid, text, undefined, { id: user.id, token: user.token });
			}
		} catch {
			// Do nothing
		}

		// if it's share extension this should close
		if (this.shareExtension) {
			ShareExtension.close();
		}
	};

	setHeader = () => {
		const { attachments, room } = this.state;
		const { navigation, theme } = this.props;

		const options = {
			headerTitle: () => <Header room={room} />,
			headerTitleAlign: 'left'
		};

		// if is share extension show default back button
		if (!this.shareExtension) {
			options.headerLeft = () => <CloseModalButton navigation={navigation} buttonStyle={{ color: themes[theme].previewTintColor }} />;
		}

		if (attachments.length > 1) {
			options.headerRight = () => (
				<CustomHeaderButtons>
					<Item
						title={I18n.t('Send')}
						onPress={this.send}
						buttonStyle={styles.send}
					/>
				</CustomHeaderButtons>
			);
		}

		options.headerBackground = () => <View style={{ flex: 1, backgroundColor: themes[theme].previewBackground }} />;

		// return options;
		navigation.setOptions(options);
	}

	selectFile = (index) => {
		this.setState({ selected: index });
	}

	onChangeText = debounce((text) => {
		this.setState({ text });
	}, 100)

	renderContent = () => {
		const {
			attachments, selected, room, loadingPreview
		} = this.state;
		const { theme, navigation } = this.props;

		if (attachments.length) {
			return (
				<View style={styles.container}>
					<Preview
						// using key just to reset zoom/move after change selected
						key={attachments[selected]?.path}
						item={attachments[selected]}
						length={attachments.length}
						theme={theme}
						shareExtension={this.shareExtension}
						loading={loadingPreview}
					/>
					<MessageBox
						showSend
						rid={room.rid}
						roomType={room.t}
						theme={theme}
						onSubmit={this.send}
						getCustomEmoji={() => {}}
						onChangeText={this.onChangeText}
						message={attachments[selected]?.description}
						navigation={navigation}
						bottomViewColor={attachments.length > 1 ? themes[theme].auxiliaryBackground : undefined}
						iOSScrollBehavior={NativeModules.KeyboardTrackingViewManager?.KeyboardTrackingScrollBehaviorNone}
					>
						<Thumbs
							onPress={this.selectFile}
							attachments={attachments}
							theme={theme}
						/>
					</MessageBox>
				</View>
			);
		}

		// Reuse
		return (
			<TextInput
				containerStyle={styles.inputContainer}
				inputStyle={[
					styles.input,
					styles.textInput,
					{ backgroundColor: themes[theme].focusedBackground }
				]}
				placeholder=''
				onChangeText={this.onChangeText}
				defaultValue=''
				multiline
				textAlignVertical='top'
				autoFocus
				theme={theme}
			/>
		);
	};

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { readOnly, room, loading } = this.state;
		const { theme } = this.props;
		if (readOnly || isBlocked(room)) {
			return (
				<View style={[styles.container, styles.centered, { backgroundColor: themes[theme].backgroundColor }]}>
					<Text style={styles.title}>
						{isBlocked(room) ? I18n.t('This_room_is_blocked') : I18n.t('This_room_is_read_only')}
					</Text>
				</View>
			);
		}
		return (
			<SafeAreaView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				theme={theme}
			>
				<StatusBar barStyle='light-content' backgroundColor={themes[theme].previewBackground} />
				{this.renderContent()}
				<Loading visible={loading} />
			</SafeAreaView>
		);
	}
}

ShareView.propTypes = {
	navigation: PropTypes.object,
	theme: PropTypes.string,
	user: PropTypes.shape({
		id: PropTypes.string.isRequired,
		username: PropTypes.string.isRequired,
		token: PropTypes.string.isRequired
	}),
	server: PropTypes.string
};

const mapStateToProps = state => ({
	user: getUserSelector(state),
	server: state.share.server || state.server.server
});

export default connect(mapStateToProps)(withTheme(ShareView));
