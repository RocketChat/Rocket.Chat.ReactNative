import { TextInputProps } from 'react-native';

import { TSupportedThemes } from '../../../theme';

type RequiredOnChangeText = Required<Pick<TextInputProps, 'onChangeText'>>;

export interface IShareListHeader {
	searching: boolean;
	onChangeSearchText: RequiredOnChangeText['onChangeText'];
	theme: TSupportedThemes;
	initSearch?: () => void;
	cancelSearch?: () => void;
}

export type IShareListHeaderIos = Required<IShareListHeader>;
