import React, { useState, ReactElement, useRef, forwardRef, useImperativeHandle, useEffect, useReducer, useContext } from 'react';
import { View, StyleSheet, NativeModules, Keyboard } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import { useBackHandler } from '@react-native-community/hooks';
import { Q } from '@nozbe/watermelondb';

import { Autocomplete, Toolbar, EmojiSearchbar, ComposerInput, Left, Right } from './components';
import { MIN_HEIGHT, NO_CANNED_RESPONSES, TIMEOUT_CLOSE_EMOJI_KEYBOARD } from './constants';
import { MessageComposerContext, MessageComposerContextProps } from './context';
import { IAutocompleteItemProps, IComposerInput, IMessageComposerProps, IMessageComposerRef, ITrackingView } from './interfaces';
import { isIOS } from '../../lib/methods/helpers';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import { EventTypes } from '../EmojiPicker/interfaces';
import { IEmoji } from '../../definitions';
import getMentionRegexp from '../MessageBox/getMentionRegexp';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import { generateTriggerId } from '../../lib/methods';
import { Services } from '../../lib/services';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { isAllOrHere } from './helpers';
import Navigation from '../../lib/navigation/appNavigation';
import { emitter } from './emitter';

const styles = StyleSheet.create({
	container: {
		borderTopWidth: 1,
		paddingHorizontal: 16,
		minHeight: MIN_HEIGHT
	},
	input: {
		flexDirection: 'row'
	}
});

require('../MessageBox/EmojiKeyboard');

type State = {
	showEmojiKeyboard: boolean;
	showEmojiSearchbar: boolean;
	focused: boolean;
};

type Actions =
	| { type: 'updateEmojiKeyboard'; showEmojiKeyboard: boolean }
	| { type: 'updateEmojiSearchbar'; showEmojiSearchbar: boolean }
	| { type: 'updateFocused'; focused: boolean };

const reducer = (state: State, action: Actions): State => {
	switch (action.type) {
		case 'updateEmojiKeyboard':
			return { ...state, showEmojiKeyboard: action.showEmojiKeyboard };
		case 'updateEmojiSearchbar':
			return { ...state, showEmojiSearchbar: action.showEmojiSearchbar };
		case 'updateFocused':
			return { ...state, focused: action.focused };
	}
};

const MessageComposerProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [state, dispatch] = useReducer(reducer, {} as State);

	return (
		<MessageComposerContext.Provider
			value={{
				focused: state.focused,
				setFocused: (focused: boolean) => dispatch({ type: 'updateFocused', focused }),
				showEmojiKeyboard: state.showEmojiKeyboard,
				showEmojiSearchbar: state.showEmojiSearchbar
				// trackingViewHeight,
				// keyboardHeight,
				// sendMessage,
				// setTrackingViewHeight
				// openEmojiKeyboard,
				// closeEmojiKeyboard,
				// onEmojiSelected,
				// closeEmojiKeyboardAndAction
			}}
		>
			{children}
		</MessageComposerContext.Provider>
	);
};

const Inner = (): ReactElement => {
	const composerInputRef = useRef(null);
	const composerInputComponentRef = useRef<IComposerInput>({
		getTextAndClear: () => '',
		getText: () => '',
		getSelection: () => ({ start: 0, end: 0 }),
		setInput: () => {},
		focus: () => {}
	});
	const trackingViewRef = useRef<ITrackingView>({ resetTracking: () => {}, getNativeProps: () => ({ trackingViewHeight: 0 }) });
	const { colors, theme } = useTheme();
	const { showEmojiKeyboard } = useContext(MessageComposerContext);

	const backgroundColor = 'red'; // editing ? colors.statusBackgroundWarning2 : colors.surfaceLight;
	return (
		<>
			<KeyboardAccessoryView
				ref={(ref: ITrackingView) => (trackingViewRef.current = ref)}
				renderContent={() => (
					<View style={[styles.container, { backgroundColor, borderTopColor: colors.strokeLight }]} testID='message-composer'>
						<View style={styles.input}>
							<Left />
							<ComposerInput ref={composerInputComponentRef} inputRef={composerInputRef} />
							<Right />
						</View>
						<Toolbar />
						<EmojiSearchbar />
					</View>
				)}
				kbInputRef={composerInputRef}
				kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
				kbInitialProps={{ theme }}
				// onKeyboardResigned={onKeyboardResigned}
				// onItemSelected={onKeyboardItemSelected}
				trackInteractive
				requiresSameParentToManageScrollView
				addBottomView
				bottomViewColor={backgroundColor}
				iOSScrollBehavior={NativeModules.KeyboardTrackingViewTempManager?.KeyboardTrackingScrollBehaviorFixedOffset}
			/>
			{/* <Autocomplete onPress={onAutocompleteItemSelected} /> */}
		</>
	);
};

export const MessageComposer = forwardRef<IMessageComposerRef, IMessageComposerProps>(
	({ onSendMessage, rid, tmid, sharing = false, editing = false, message, editCancel, editRequest }, ref): ReactElement => (
		// console.count('Message Composer');
		// const [trackingViewHeight, setTrackingViewHeight] = useState(0);
		// const keyboardHeight = 0;

		<MessageComposerContextProps.Provider
			value={{
				rid,
				tmid,
				editing,
				sharing,
				message,
				editCancel
			}}
		>
			<MessageComposerProvider>
				<Inner />
			</MessageComposerProvider>
		</MessageComposerContextProps.Provider>
	)
);
