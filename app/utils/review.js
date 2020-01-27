import { Alert } from 'react-native';
import RNUserDefaults from 'rn-user-defaults';

const eventPositiveKey = 'eventPositiveKey';

export const review = async(options = { handleEventCount: 3 }) => {
	const { handleEventCount } = options;
	const eventPositiveCount = await RNUserDefaults.get(eventPositiveKey) || 0;
	const parseEventPositive = parseInt(eventPositiveCount, 10);

	if (parseEventPositive === handleEventCount) {
		Alert.alert(
			'Are you enjoying this app?',
			'Give us some love on the Play Store',
			[
				{ text: 'Ask me later', onPress: () => RNUserDefaults.clear(eventPositiveKey) },
				{ text: 'Sure!' }
			]
		);
	} else if (parseEventPositive < handleEventCount) {
		await RNUserDefaults.set(eventPositiveKey, (parseEventPositive + 1).toString());
	}
};
