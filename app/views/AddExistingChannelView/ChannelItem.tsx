import * as List from '~/containers/List';
import { type TIconsName } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';

export interface IChannelItem {
	title: string;
	icon: TIconsName;
	isChecked: boolean;
	onPress: () => void;
	testID: string;
	isFirst: boolean;
	isLast: boolean;
}

const ChannelItem = ({ title, icon, isChecked, onPress, testID }: IChannelItem) => {
	const { colors } = useTheme();
	return (
		<List.Item
			title={title}
			translateTitle={false}
			onPress={onPress}
			testID={testID}
			left={() => <List.Icon name={icon} />}
			right={() => (isChecked ? <List.Icon name='check' color={colors.fontHint} /> : null)}
			additionalAccessibilityLabel={isChecked}
			additionalAccessibilityLabelCheck
		/>
	);
};

export default ChannelItem;
