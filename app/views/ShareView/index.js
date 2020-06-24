import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, Text, NativeModules } from 'react-native';
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
import { getUserSelector } from '../../selectors/login';
import StatusBar from '../../containers/StatusBar';

class ShareView extends Component {
	constructor(props) {
		super(props);
		this.messagebox = React.createRef();
		this.files = props.route.params?.attachments ?? [];
		this.shareExtension = props.route.params?.shareExtension;

		this.state = {
			selected: {},
			loading: false,
			readOnly: false,
			attachments: [],
			text: props.route.params?.text ?? '',
			room: props.route.params?.room ?? {},
			thread: props.route.params?.thread ?? {}
		};
	}

	componentDidMount = async() => {
		const readOnly = await this.getReadOnly();
		const { attachments, selected } = await this.getAttachments();
		this.setState({ readOnly, attachments, selected }, () => this.setHeader());
	}

	componentWillUnmount = () => {
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	setHeader = () => {
		const {
			room, thread, readOnly, attachments
		} = this.state;
		const { navigation, theme } = this.props;

		const options = {
			headerTitle: () => <Header room={room} thread={thread} />,
			headerTitleAlign: 'left',
			headerTintColor: themes[theme].previewTintColor
		};

		// if is share extension show default back button
		if (!this.shareExtension) {
			options.headerLeft = () => <CloseModalButton navigation={navigation} buttonStyle={{ color: themes[theme].previewTintColor }} />;
		}

		if (!attachments.length && !readOnly) {
			options.headerRight = () => (
				<CustomHeaderButtons>
					<Item
						title={I18n.t('Send')}
						onPress={this.send}
						buttonStyle={[styles.send, { color: themes[theme].previewTintColor }]}
					/>
				</CustomHeaderButtons>
			);
		}

		options.headerBackground = () => <View style={[styles.container, { backgroundColor: themes[theme].previewBackground }]} />;

		navigation.setOptions(options);
	}

	getReadOnly = async() => {
		const { room } = this.state;
		const { user } = this.props;
		const readOnly = await isReadOnly(room, user);
		return readOnly;
	}

	getAttachments = async() => {
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
			if (!item.filename) {
				item.filename = new Date().toISOString();
			}
			return item;
		}));
		// this.setState({ attachments: items, selected: items[0] });
		return {
			attachments: items,
			selected: items[0]
		};
	}

	send = async() => {
		const { loading, selected } = this.state;
		if (loading) {
			return;
		}

		// update state
		await this.selectFile(selected);

		const {
			attachments, room, text, thread
		} = this.state;
		const { navigation, server, user } = this.props;

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
					thread?.tmid,
					server,
					{ id: user.id, token: user.token }
				)));

			// Send text message
			} else if (text.length) {
				await RocketChat.sendMessage(room.rid, text, thread?.tmid, { id: user.id, token: user.token });
			}
		} catch {
			// Do nothing
		}

		// if it's share extension this should close
		if (this.shareExtension) {
			ShareExtension.close();
		}
	};

	selectFile = (item) => {
		const { text } = this.messagebox.current;
		const { attachments, selected } = this.state;
		const newAttachments = attachments.map((att) => {
			if (att.path === selected.path) {
				att.description = text;
			}
			return att;
		});
		this.setState({ attachments: newAttachments, selected: item });
	}

	removeFile = (item) => {
		this.setState(({ attachments }) => ({ attachments: attachments.filter(att => att.path !== item.path) }));
	}

	onChangeText = (text) => {
		const { attachments } = this.state;
		// we manage attachments on this state only when it's text only sharing
		if (!attachments.length) {
			this.setState({ text });
		}
	}

	renderContent = () => {
		const {
			attachments, selected, room, text
		} = this.state;
		const { theme, navigation } = this.props;

		if (attachments.length) {
			return (
				<View style={styles.container}>
					<Preview
						// using key just to reset zoom/move after change selected
						key={selected?.path}
						item={selected}
						length={attachments.length}
						theme={theme}
						shareExtension={this.shareExtension}
					/>
					<MessageBox
						showSend
						sharing
						ref={this.messagebox}
						rid={room.rid}
						roomType={room.t}
						theme={theme}
						onSubmit={this.send}
						message={{ msg: selected?.description ?? '' }}
						navigation={navigation}
						isFocused={navigation.isFocused}
						iOSScrollBehavior={NativeModules.KeyboardTrackingViewManager?.KeyboardTrackingScrollBehaviorNone}
						isActionsEnabled={false}
					>
						<Thumbs
							attachments={attachments}
							theme={theme}
							onPress={this.selectFile}
							onRemove={this.removeFile}
						/>
					</MessageBox>
				</View>
			);
		}

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
				value={text}
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
	route: PropTypes.object,
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
