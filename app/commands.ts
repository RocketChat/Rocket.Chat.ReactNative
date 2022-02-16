/* eslint-disable no-bitwise */
import { NativeSyntheticEvent } from 'react-native';
import KeyCommands, { constants, KeyCommand } from 'react-native-keycommands';

import I18n from './i18n';

const KEY_TYPING = '\t';
const KEY_PREFERENCES = 'p';
const KEY_SEARCH = 'f';
const KEY_PREVIOUS_ROOM = '[';
const KEY_NEXT_ROOM = ']';
const KEY_NEW_ROOM = __DEV__ ? 'e' : 'n';
const KEY_ROOM_ACTIONS = __DEV__ ? 'b' : 'i';
const KEY_UPLOAD = 'u';
const KEY_REPLY = ';';
const KEY_SERVER_SELECTION = __DEV__ ? 'o' : '`';
const KEY_ADD_SERVER = __DEV__ ? 'l' : 'n';
const KEY_SEND_MESSAGE = '\r';
const KEY_SELECT = '123456789';

const keyCommands = [
	{
		// Focus messageBox
		input: KEY_TYPING,
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Type_message')
	},
	{
		// Send message on textInput to current room
		input: KEY_SEND_MESSAGE,
		modifierFlags: 0,
		discoverabilityTitle: I18n.t('Send')
	},
	{
		// Open Preferences Modal
		input: KEY_PREFERENCES,
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Preferences')
	},
	{
		// Focus Room Search
		input: KEY_SEARCH,
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
		input: KEY_NEXT_ROOM,
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Next_room')
	},
	{
		// Change room to previous on Rooms List
		input: KEY_PREVIOUS_ROOM,
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Previous_room')
	},
	{
		// Open New Room Modal
		input: KEY_NEW_ROOM,
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('New_room')
	},
	{
		// Open Room Actions
		input: KEY_ROOM_ACTIONS,
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Room_actions')
	},
	{
		// Upload a file to room
		input: KEY_UPLOAD,
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Upload_room')
	},
	{
		// Search Messages on current room
		input: KEY_SEARCH,
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
		// Reply latest message with Quote
		input: KEY_REPLY,
		modifierFlags: constants.keyModifierCommand,
		discoverabilityTitle: I18n.t('Reply_latest')
	},
	{
		// Open server dropdown
		input: KEY_SERVER_SELECTION,
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
		input: KEY_ADD_SERVER,
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
		discoverabilityTitle: I18n.t('Add_server')
	},
	// Refers to select rooms on list
	...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
		input: `${value}`,
		modifierFlags: constants.keyModifierCommand
	})),
	// Refers to select servers on list
	...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
		input: `${value}`,
		modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate
	}))
];

export const setKeyCommands = (): void => KeyCommands.setKeyCommands(keyCommands);

export const deleteKeyCommands = (): void => KeyCommands.deleteKeyCommands(keyCommands);

export const KEY_COMMAND = 'KEY_COMMAND';

interface IKeyCommandEvent extends NativeSyntheticEvent<typeof KeyCommand> {
	input: string;
	modifierFlags: string | number;
}

export const commandHandle = (event: IKeyCommandEvent, key: string | string[], flags: string[] = []): boolean => {
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

export const handleCommandTyping = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_TYPING);

export const handleCommandSubmit = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_SEND_MESSAGE);

export const handleCommandShowUpload = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_UPLOAD, ['command']);

export const handleCommandScroll = (event: IKeyCommandEvent): boolean =>
	commandHandle(event, [constants.keyInputUpArrow, constants.keyInputDownArrow], ['alternate']);

export const handleCommandRoomActions = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_ROOM_ACTIONS, ['command']);

export const handleCommandSearchMessages = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_SEARCH, ['command']);

export const handleCommandReplyLatest = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_REPLY, ['command']);

export const handleCommandSelectServer = (event: IKeyCommandEvent): boolean =>
	commandHandle(event, KEY_SELECT, ['command', 'alternate']);

export const handleCommandShowPreferences = (event: IKeyCommandEvent): boolean =>
	commandHandle(event, KEY_PREFERENCES, ['command']);

export const handleCommandSearching = (event: IKeyCommandEvent): boolean =>
	commandHandle(event, KEY_SEARCH, ['command', 'alternate']);

export const handleCommandSelectRoom = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_SELECT, ['command']);

export const handleCommandPreviousRoom = (event: IKeyCommandEvent): boolean =>
	commandHandle(event, KEY_PREVIOUS_ROOM, ['command']);

export const handleCommandNextRoom = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_NEXT_ROOM, ['command']);

export const handleCommandShowNewMessage = (event: IKeyCommandEvent): boolean => commandHandle(event, KEY_NEW_ROOM, ['command']);

export const handleCommandAddNewServer = (event: IKeyCommandEvent): boolean =>
	commandHandle(event, KEY_ADD_SERVER, ['command', 'alternate']);

export const handleCommandOpenServerDropdown = (event: IKeyCommandEvent): boolean =>
	commandHandle(event, KEY_SERVER_SELECTION, ['command', 'alternate']);
