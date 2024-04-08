import { NativeModules, NativeEventEmitter } from 'react-native';

import { IKeyCommand } from '../../definitions/IKeyCommand';

const { KeyCommandsManager } = NativeModules;

const eventEmitter = new NativeEventEmitter(NativeModules.KeyCommandsManager);

class KeyCommands {
	registeredListeners: { [id: string]: (keyCommand: IKeyCommand) => void } = {};

	constructor() {
		eventEmitter.addListener('onKeyCommand', this.onKeyCommand);
	}

	onKeyCommand = (keyCommand: IKeyCommand) => {
		const key = this.makeKey(keyCommand);
		const listener = this.registeredListeners[key];

		listener(keyCommand);
	};

	addListener = (keyCommand: IKeyCommand, handler: (keyCommand: IKeyCommand) => void) => {
		const key = this.makeKey(keyCommand);
		this.registeredListeners[key] = handler;
		KeyCommandsManager.registerKeyCommand(keyCommand.input, keyCommand.modifierFlags, keyCommand.discoverableTitle);
	};

	removeListener = (keyCommand: IKeyCommand) => {
		const key = this.makeKey(keyCommand);
		delete this.registeredListeners[key];
	};

	makeKey = (keyCommand: IKeyCommand): string => keyCommand.input + keyCommand.modifierFlags;
}

export default new KeyCommands();

// class SearchKeyCommand implements IKeyCommand {
// 	input = "f";
// 	modifierFlags: number = 0;
// 	discoverableTitle: string = "any";
// }

// new KeyCommands().addListener(new Command(), (command) => { console.log(command) })
