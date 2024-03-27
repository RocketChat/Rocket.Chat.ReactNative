import React from 'react';

import * as List from '../../containers/List';
import { themes } from '../../lib/constants';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import { useTheme } from '../../theme';

interface IButton {
	onPress: () => void;
	testID: string;
	title: string;
	icon: TIconsName;
}

const ButtonCreate = ({ onPress, testID, title, icon }: IButton) => {
	const { theme } = useTheme();

	return (
		<>
			<List.Item
				onPress={onPress}
				testID={testID}
				left={() => <CustomIcon name={icon} size={24} color={themes[theme].fontDefault} />}
				right={() => <CustomIcon name={'chevron-right'} size={24} color={themes[theme].fontDefault} />}
				title={title}
			/>
			<List.Separator />
		</>
	);
};

export default ButtonCreate;
