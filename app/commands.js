import React from 'react';
import DeviceInfo from 'react-native-device-info';
import KeyCommands, { constants } from '@envoy/react-native-key-commands';

import I18n from './i18n';
import EventEmitter from './utils/events';

const keyCommands = [
	{
		input: '\t', // done
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Type_message')
	},
	{
		input: 'p', // done
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Preferences')
	},
	{
		input: 'f', // done
		// eslint-disable-next-line no-bitwise
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Room_search')
	},
	{
		input: '1...9', // done
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Room_selection')
	},
	{
		input: ']', // done
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Next_room')
	},
	{
		input: '[', // done
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
		input: 'u', // done
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Upload_room')
	},
	{
		input: 'f', // It's harder
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Search_messages')
	},
	{
		input: '↑ ↓', // done
		modifierFlags: constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Scroll_messages')
	},
	{
		input: constants.keyInputUpArrow, // done
		modifierFlags: constants.keyModifierAlternate
	},
	{
		input: constants.keyInputDownArrow, // done
		modifierFlags: constants.keyModifierAlternate
	},
	{
		input: 'r',
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Reply_latest')
	},
	{
		input: 'o', // (`) done
		// eslint-disable-next-line no-bitwise
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Server_selection')
	},
	{
		input: '1...9', // done
		// eslint-disable-next-line no-bitwise
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Server_selection_numbers')
	},
	{
		input: 'n', // it should be n
		// eslint-disable-next-line no-bitwise
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Add_server')
	},
	{
		input: '\r', // done
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Send')
	},
	{
		input: '\r', // i dont know if we need it, we have shift + enter
		modifierFlags: constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('New_line')
	},
	...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({ // done
		input: `${ value }`,
		modifierFlags: constants.keyModifierCommand
	}))),
	...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({ // done
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
