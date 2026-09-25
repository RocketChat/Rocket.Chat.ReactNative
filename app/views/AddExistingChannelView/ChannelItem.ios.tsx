import * as List from '~/containers/List';
import NativeListRow from '~/containers/NativeListRow';
import { AVATAR_SIZE } from '~/containers/NativeListRow/constants';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import { type IChannelItem } from './ChannelItem';

const ChannelItem = ({ title, icon, isChecked, onPress, testID, isFirst, isLast }: IChannelItem) => {
	const { colors } = useTheme();
	return (
		<NativeListRow
			title={title}
			onPress={onPress}
			testID={testID}
			accessibilityLabel={`${title} ${isChecked ? I18n.t('Checked') : I18n.t('Unchecked')}`}
			isSelected={isChecked}
			isFirst={isFirst}
			isLast={isLast}
			leading={<List.Icon name={icon} style={{ width: AVATAR_SIZE }} />}
			trailing={isChecked ? <List.Icon name='check' color={colors.fontHint} /> : undefined}
		/>
	);
};

export default ChannelItem;
