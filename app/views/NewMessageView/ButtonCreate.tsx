import { type ReactElement } from 'react';

import * as List from '~/containers/List';
import { themes } from '~/lib/constants/colors';
import { CustomIcon } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';

export interface IButton {
	onPress: () => void;
	testID: string;
	title: string;
	icon: ReactElement;
	isFirst?: boolean;
	isLast?: boolean;
}

const ButtonCreate = ({ onPress, testID, title, icon }: IButton) => {
	const { theme } = useTheme();

	return (
		<>
			<List.Item
				onPress={onPress}
				testID={testID}
				left={() => icon}
				right={() => <CustomIcon name={'chevron-right'} size={24} color={themes[theme].fontDefault} />}
				title={title}
				backgroundColor={themes[theme].surfaceLight}
			/>
			<List.Separator />
		</>
	);
};

export default ButtonCreate;
