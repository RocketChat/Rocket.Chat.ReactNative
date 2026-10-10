import * as List from '~/containers/List';
import NativeListRow from '~/containers/NativeListRow';
import Disclosure from '~/containers/NativeListRow/components/Disclosure';
import { PlainSeparator } from '~/containers/NativeListRow/components/Separator';
import I18n from '~/i18n';
import { type IButton } from './ButtonCreate';

const ButtonCreate = ({ onPress, testID, title, icon, isFirst, isLast }: IButton) => {
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
				leading={<List.Icon name={icon} />}
				trailing={<Disclosure />}
			/>
			{isLast ? null : <PlainSeparator />}
		</>
	);
};

export default ButtonCreate;
