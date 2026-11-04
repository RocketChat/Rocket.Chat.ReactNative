import { Host, Toggle } from '@expo/ui/swift-ui';
import { disabled as disabledModifier, labelsHidden, tint } from '@expo/ui/swift-ui/modifiers';

import { type INativeListToggle } from './Toggle';

const NativeListToggle = ({ value, onValueChange, disabled, testID, tintColor }: INativeListToggle) => (
	<Host matchContents>
		<Toggle
			isOn={value}
			onIsOnChange={onValueChange}
			testID={testID}
			modifiers={[labelsHidden(), tint(tintColor), disabledModifier(Boolean(disabled))]}
		/>
	</Host>
);

export default NativeListToggle;
