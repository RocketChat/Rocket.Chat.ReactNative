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
		// eslint-disable-next-line no-bitwise
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
		input: 'n',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('New_room')
	},
	{
		input: 'i',
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
		input: 'r',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Reply_latest')
	},
	{
		input: '`',
		// eslint-disable-next-line no-bitwise
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Server_selection')
	},
	{
		input: '1...9',
		// eslint-disable-next-line no-bitwise
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Server_selection_numbers')
	},
	{
		input: 'n',
		// eslint-disable-next-line no-bitwise
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Add_server')
	},
	{
		input: '\r',
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Send')
	},
	{
		input: '\r',
		modifierFlags: constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('New_line')
	},
	...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
		input: `${ value }`,
		modifierFlags: constants.keyModifierCommand
	}))),
	...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
		input: `${ value }`,
		// eslint-disable-next-line no-bitwise
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate
	})))
];

export const KEY_COMMAND = 'KEY_COMMAND';

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
