import { I18nManager } from 'react-native';
import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import NativeListIcon from '~/containers/List/NativeListIcon.ios';
import NativeListRow from '~/containers/NativeListRow';
import { PlainSeparator } from '~/containers/NativeListRow/Separator';
import I18n from '~/i18n';
import { useTheme } from '~/theme';

interface IButton {
	onPress: () => void;
	testID: string;
	title: string;
	icon: TIconsName;
	isFirst?: boolean;
	isLast?: boolean;
}

const CHEVRON = I18nManager.isRTL ? 'chevron-left' : 'chevron-right';

const ButtonCreate = ({ onPress, testID, title, icon, isFirst, isLast }: IButton) => {
	const { colors } = useTheme();
	const translatedTitle = I18n.t(title);

	return (
		<>
			<NativeListRow
				title={translatedTitle}
				onPress={onPress}
				testID={testID}
				accessibilityLabel={translatedTitle}
				isFirst={isFirst}
				isLast={isLast}
				leading={<CustomIcon name={icon} size={24} color={colors.fontDefault} />}
				trailing={<NativeListIcon name={CHEVRON} color={colors.fontDefault} />}
			/>
			{isLast ? null : <PlainSeparator />}
		</>
	);
};

export default ButtonCreate;
