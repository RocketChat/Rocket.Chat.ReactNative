import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface KeyboardInversionState {
	enabled: boolean;
	scope: 'room-view' | null;
}

interface Spec extends TurboModule {
	enable(scope: 'room-view'): void;
	disable(): void;
	getState(): Promise<KeyboardInversionState>;
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('KeyboardA11y');

export const enableRoomViewKeyboardA11y = (scope: 'room-view' = 'room-view') => {
	NativeModule.enable(scope);
};

export const disableKeyboardA11y = () => {
	NativeModule.disable();
};

export const getKeyboardA11yState = () => NativeModule.getState();

