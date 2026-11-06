import { View } from 'react-native';
import { Host, Toggle } from '@expo/ui/swift-ui';
import { disabled as disabledModifier, labelsHidden, tint } from '@expo/ui/swift-ui/modifiers';

import { type INativeListToggle } from './Toggle';

const claimTouch = () => true;

const NativeListToggle = ({ value, onValueChange, disabled, testID, tintColor }: INativeListToggle) => (
	<View onStartShouldSetResponder={claimTouch}>
		<Host matchContents>
			<Toggle
				isOn={value}
				onIsOnChange={onValueChange}
				testID={testID}
				modifiers={[labelsHidden(), tint(tintColor), disabledModifier(Boolean(disabled))]}
			/>
		</Host>
	</View>
);

export default NativeListToggle;
