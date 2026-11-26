import type { HybridObject } from 'react-native-nitro-modules';

export interface MessageParser extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
	parse(input: string, optionsJson: string): Promise<string>;
}
