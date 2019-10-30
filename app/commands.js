/* eslint-disable no-bitwise */
import React from 'react';
import DeviceInfo from 'react-native-device-info';
import KeyCommands, { constants } from '@envoy/react-native-key-commands';

import I18n from './i18n';
import EventEmitter from './utils/events';

const keyCommands = [
	{
		input: '\t',
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Type_message')
	},
	{
		input: 'p',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Preferences')
	},
	{
		input: 'f',
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Room_search')
	},
	{
		input: '1...9',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Room_selection')
	},
	{
		input: ']',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Next_room')
	},
	{
		input: '[',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Previous_room')
	},
	{
		input: 'e', // it should be n
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('New_room')
	},
	{
		input: 'b', // it should be i
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Room_actions')
	},
	{
		input: 'u',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Upload_room')
	},
	{
		input: 'f',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Search_messages')
	},
	{
		input: '↑ ↓',
		modifierFlags: constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Scroll_messages')
	},
	{
		input: constants.keyInputUpArrow,
		modifierFlags: constants.keyModifierAlternate
	},
	{
		input: constants.keyInputDownArrow,
		modifierFlags: constants.keyModifierAlternate
	},
	{
		input: constants.keyInputEscape,
		modifierFlags: 0
	},
	{
		input: ';',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Reply_latest')
	},
	{
		input: 'o', // it should be (`)
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Server_selection')
	},
	{
		input: '1...9',
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Server_selection_numbers')
	},
	{
		input: 'l', // it should be n
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Add_server')
	},
	{
		input: '\r',
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Send')
	},
	...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
		input: `${ value }`,
		modifierFlags: constants.keyModifierCommand
	}))),
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

export default ({ children }) => {
	const onKeyCommand = (event) => {
		EventEmitter.emit(KEY_COMMAND, { event: event.nativeEvent });
	};

	if (DeviceInfo.isTablet()) {
		return (
			<KeyCommands
				style={{ flex: 1 }}
				keyCommands={keyCommands}
				onKeyCommand={onKeyCommand}
			>
				{children}
			</KeyCommands>
		);
	}
	return children;
};
