import React, { useRef } from 'react';
import {
	ScrollView, StyleSheet, View
} from 'react-native';

import MessageboxContext from '../../app/containers/MessageBox/Context';
import MainComposer from '../../app/containers/MessageBox/MainComposer';
import FullScreenComposer from '../../app/containers/MessageBox/FullScreenComposer';
import StoriesSeparator from './StoriesSeparator';

import { themes } from '../../app/constants/colors';

let _theme = 'light';

const styles = StyleSheet.create({
	separator: {
		marginTop: 30,
		marginBottom: 20
	},
	modal: {
		height: 400
	}
});

const user = {
	id: '2hk9RMaZxhQPD5m4Q',
	username: 'ezequiel.reis',
	token: 'WNOFyZdehMX6dVPaVQOo_goD1t4QFRi9EV9KH5nB-0J'
};

const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.😃😇😃😇😃😇😃😇😃😇😃😇😃😇';
const baseUrl = 'https://open.rocket.chat';
const date = new Date(2020, 7, 14, 4);

const getCustomEmoji = (content) => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		react_rocket: { name: content, extension: 'png' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content];
	return customEmoji;
};

const commonProps = {
	closeEmoji: () => {},
	toggleFullScreen: () => {},
	commandPreview: [],
	editCancel: () => {},
	editing: false,
	getCustomEmoji,
	iOSScrollBehavior: 0,
	isActionsEnabled: false,
	isFullScreen: false,
	mentions: [],
	message: {},
	Message_AudioRecorderEnabled: false,
	onChangeText: () => {},
	onKeyboardResigned: () => {},
	onEmojiSelected: () => {},
	openEmoji: () => {},
	recording: false,
	recordingCallback: () => {},
	replyCancel: () => {},
	replying: false,
	showCommandPreview: false,
	showEmojiKeyboard: false,
	showMessageBoxActions: () => {},
	showSend: false,
	submit: () => {},
	text: '',
	theme: _theme,
	toggleRecordAudioWithState: () => {},
	trackingType: [],
	user,
	autoFocus: false,
	backdropOpacity: 0
};

const Main = props => (
	<MainComposer
		ref={{
			component: useRef(),
			tracking: useRef()
		}}
		{...commonProps}
		isFullScreen={false}
		{...props}
	/>
);

const FullScreen = props => (
	<View style={styles.modal}>
		<FullScreenComposer
			ref={{
				component: useRef(),
				tracking: useRef()
			}}
			{...commonProps}
			{...props}
		/>
	</View>
);


// eslint-disable-next-line react/prop-types
const Separator = ({ title, theme }) => <StoriesSeparator title={title} theme={theme} style={styles.separator} />;

// eslint-disable-next-line react/prop-types
export default ({ theme }) => {
	_theme = theme;
	return (
		<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }}>
			<MessageboxContext.Provider
				value={{
					user,
					baseUrl,
					onPressMention: () => {},
					onPressCommandPreview: () => {}
				}}
			>

				<Separator title='Simple' theme={_theme} />
				<Main />

				<Separator title='Simple with content' theme={_theme} />
				<Main showSend text='A simple text' />

				<Separator title='Editing' theme={_theme} />
				<Main editing text='Editable message' showSend />

				<Separator title='Replying' theme={_theme} />
				<Main
					message={
						{
							u: { username: 'ezequiel.reis', name: 'Ezequiel' },
							msg: 'Message to reply 👊🤙👏',
							ts: date
						}
					}
					replying
					replyCancel={() => {}}
				/>

				<Separator title='Simple' theme={_theme} />
				<FullScreen />

				<Separator title='Simple with content' theme={_theme} />
				<FullScreen showSend text={longText} />

				<Separator title='Editing' theme={_theme} />
				<FullScreen editing text={`Editing this too long message. ${ longText }`} showSend />

				<Separator title='Replying' theme={_theme} />
				<FullScreen
					message={
						{
							u: { username: 'ezequiel.reis', name: 'Ezequiel' },
							msg: 'Message to reply 👊🤙👏',
							ts: date
						}
					}
					replying
					replyCancel={() => {}}
				/>

			</MessageboxContext.Provider>
		</ScrollView>
	);
};
