import { CustomIcon } from '~/containers/CustomIcon';
import NativeListRow from '~/containers/NativeListRow';
import Disclosure from '~/containers/NativeListRow/components/Disclosure.ios';
import { PlainSeparator } from '~/containers/NativeListRow/components/Separator';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import { type IButton } from './ButtonCreate';

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
				trailing={<Disclosure />}
			/>
			{isLast ? null : <PlainSeparator />}
		</>
	);
};

export default ButtonCreate;
