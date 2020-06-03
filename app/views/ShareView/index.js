import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import ShareExtension from 'rn-extensions-share';
import * as VideoThumbnails from 'expo-video-thumbnails';

import { themes } from '../../constants/colors';
import I18n from '../../i18n';
import styles from './styles';
import Loading from '../../containers/Loading';
import {
	Item,
	CancelModalButton,
	CustomHeaderButtons
} from '../../containers/HeaderButton';
import { isBlocked } from '../../utils/room';
import { isReadOnly } from '../../utils/isReadOnly';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import Header from './Header';
import RocketChat from '../../lib/rocketchat';
import TextInput from '../../containers/TextInput';
import Preview from './Preview';
import Thumbs from './Thumbs';

const ShareView = React.memo(({
	navigation,
	theme,
	user: {
		id,
		username,
		token
	},
	server
}) => {
	const [selected] = useState(0);
	const [loading, setLoading] = useState(false);
	const [readOnly, setReadOnly] = useState(false);
	const [attachments, setAttachments] = useState([]);
	const [text, setText] = useState(navigation.getParam('text', ''));
	const shareExtension = navigation.getParam('shareExtension');
	const files = navigation.getParam('attachments', []);
	const room = navigation.getParam('room', {});

	const sendFiles = async() => {
		if (loading) {
			return;
		}

		if (shareExtension) {
			setLoading(true);
		} else {
			navigation.pop();
		}

		try {
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
				{ id, token }
			)));
		} catch {
			// Do nothing
		}

		if (shareExtension) {
			ShareExtension.close();
		}
	};

	useEffect(() => {
		(async() => {
			const ro = await isReadOnly(room, { username });
			setReadOnly(ro);
		})();

		(async() => {
			// set attachments just when it was mounted to prevent memory issues
			const videos = files.filter(attachment => attachment.mime.match(/video/));
			if (videos?.length) {
				try {
					await Promise.all(videos.map(async(video, index) => {
						const { uri } = await VideoThumbnails.getThumbnailAsync(video.path);
						files[index].uri = uri;
					}));
				} catch {
					// Do nothing
				}
			}
			setAttachments(files);
		})();

		navigation.setParams({
			sendFiles,
			sendMessage: async() => {
				if (shareExtension) {
					setLoading(true);
				} else {
					navigation.pop();
				}

				try {
					await RocketChat.sendMessage(room.rid, text, undefined, { id, token });
				} catch {
					// Do nothing
				}

				if (shareExtension) {
					ShareExtension.close();
				}
			}
		});
	}, []);

	if (readOnly || isBlocked(room)) {
		return (
			<View style={[styles.container, styles.centered, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={styles.title}>
					{isBlocked(room) ? I18n.t('This_room_is_blocked') : I18n.t('This_room_is_read_only')}
				</Text>
			</View>
		);
	}

	const renderContent = () => {
		if (files.length) {
			return (
				<View style={styles.container}>
					<View style={styles.container}>
						<Preview
							item={attachments[selected]}
							theme={theme}
						/>
					</View>
					<Thumbs
						attachments={attachments}
						theme={theme}
					/>
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
				onChangeText={setText}
				defaultValue={text}
				multiline
				textAlignVertical='top'
				autoFocus
				theme={theme}
			/>
		);
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
			{renderContent()}
			<Loading visible={loading} />
		</SafeAreaView>
	);
});
ShareView.navigationOptions = ({ navigation, screenProps }) => {
	const { theme } = screenProps;
	const room = navigation.getParam('room', {});
	const attachments = navigation.getParam('attachments', []);
	const shareExtension = navigation.getParam('shareExtension');

	const options = {
		...themedHeader(screenProps.theme),
		headerTitle: <Header room={room} theme={theme} />
	};

	// if is share extension show default back button
	if (!shareExtension) {
		options.headerLeft = <CancelModalButton onPress={() => navigation.pop()} />;
	}

	if (!attachments.length) {
		options.headerRight = (
			<CustomHeaderButtons>
				<Item
					title={I18n.t('Send')}
					onPress={navigation.getParam('sendMessage')}
					buttonStyle={styles.send}
				/>
			</CustomHeaderButtons>
		);
	}

	return options;
};
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

const mapStateToProps = (({ share, login, server }) => ({
	user: {
		id: share.user?.id || login.user?.id,
		username: share.user?.username || login.user?.username,
		token: share.user?.token || login.user?.token
	},
	server: share.server || server.server
}));

export default connect(mapStateToProps)(withTheme(ShareView));
