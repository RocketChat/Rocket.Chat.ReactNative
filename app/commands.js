/* eslint-disable no-bitwise */
import React from 'react';
import PropTypes from 'prop-types';
import KeyCommands, { constants } from '@envoy/react-native-key-commands';

import I18n from './i18n';
import EventEmitter from './utils/events';
import { isTablet } from './utils/deviceInfo';

const keyCommands = [
	{
		// Focus messageBox
		input: '\t',
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Type_message')
	},
	{
		// Open Preferences Modal
		input: 'p',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Preferences')
	},
	{
		// Focus Room Search
		input: 'f',
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Room_search')
	},
	{
		// Select a room by order using 1-9
		input: '1...9',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Room_selection')
	},
	{
		// Change room to next on Rooms List
		input: ']',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Next_room')
	},
	{
		// Change room to previous on Rooms List
		input: '[',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Previous_room')
	},
	{
		// Open New Room Modal
		input: 'e', // it should be n
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('New_room')
	},
	{
		// Open Room Actions
		input: 'b', // it should be i
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Room_actions')
	},
	{
		// Upload a file to room
		input: 'u',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Upload_room')
	},
	{
		// Search Messages on current room
		input: 'f',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Search_messages')
	},
	{
		// Scroll messages on current room
		input: '↑ ↓',
		modifierFlags: constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Scroll_messages')
	},
	{
		// Scroll up messages on current room
		input: constants.keyInputUpArrow,
		modifierFlags: constants.keyModifierAlternate
	},
	{
		// Scroll down messages on current room
		input: constants.keyInputDownArrow,
		modifierFlags: constants.keyModifierAlternate
	},
	{
		// Close modal
		input: constants.keyInputEscape,
		modifierFlags: 0
	},
	{
		// Reply latest message with Quote
		input: ';',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Reply_latest')
	},
	{
		// Open server dropdown
		input: 'o', // it should be (`)
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Server_selection')
	},
	{
		// Select a server by order using 1-9
		input: '1...9',
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Server_selection_numbers')
	},
	{
		// Navigate to add new server
		input: 'l', // it should be n
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Add_server')
	},
	{
		// Send message on textInput to current room
		input: '\r',
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Send')
	},
	// Refers to select rooms on list
	...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
		input: `${ value }`,
		modifierFlags: constants.keyModifierCommand
	}))),
	// Refers to select servers on list
	...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
		input: `${ value }`,
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate
	})))
];

export const KEY_COMMAND = 'KEY_COMMAND';

export const commandHandle = (event, key, flags = []) => {
	const { input, modifierFlags } = event;
	let _flags = 0;
	if (flags.includes('command') && flags.includes('alternate')) {
		_flags = constants.keyModifierCommand | constants.keyModifierAlternate;
	} else if (flags.includes('command')) {
		_flags = constants.keyModifierCommand;
	} else if (flags.includes('alternate')) {
		_flags = constants.keyModifierAlternate;
	}
	return key.includes(input) && modifierFlags === _flags;
};

export const handleCommandTyping = event => commandHandle(event, '\t');

export const handleCommandSubmit = event => commandHandle(event, '\r');

export const handleCommandShowUpload = event => commandHandle(event, 'u', ['command']);

export const handleCommandScroll = event => commandHandle(event, ['UIKeyInputUpArrow', 'UIKeyInputDownArrow'], ['alternate']);

export const handleCommandRoomActions = event => commandHandle(event, 'b', ['command']);

export const handleCommandSearchMessages = event => commandHandle(event, 'f', ['command']);

export const handleCommandReplyLatest = event => commandHandle(event, ';', ['command']);

export const handleCommandSelectServer = event => commandHandle(event, '123456789', ['command', 'alternate']);

export const handleCommandShowPreferences = event => commandHandle(event, 'p', ['command']);

export const handleCommandSearching = event => commandHandle(event, 'f', ['command', 'alternate']);

export const handleCommandSelectRoom = event => commandHandle(event, '123456789', ['command']);

export const handleCommandPreviousRoom = event => commandHandle(event, '[', ['command']);

export const handleCommandNextRoom = event => commandHandle(event, ']', ['command']);

export const handleCommandShowNewMessage = event => commandHandle(event, 'e', ['command']);

export const handleCommandAddNewServer = event => commandHandle(event, 'l', ['command', 'alternate']);

export const handleCommandCloseModal = event => commandHandle(event, 'UIKeyInputEscape');

const Commands = ({ children, style }) => {
	const onKeyCommand = (event) => {
		EventEmitter.emit(KEY_COMMAND, { event: event.nativeEvent });
	};

	if (isTablet) {
		return (
			<KeyCommands
				style={style || { flex: 1 }}
				keyCommands={keyCommands}
				onKeyCommand={onKeyCommand}
			>
				{children}
			</KeyCommands>
		);
	}
	return children;
};

Commands.propTypes = {
	children: PropTypes.node,
	style: PropTypes.any
};

export default Commands;
