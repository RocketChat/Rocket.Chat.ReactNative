import { TextInputProps } from 'react-native';

type RequiredOnChangeText = Required<Pick<TextInputProps, 'onChangeText'>>;

export interface IShareListHeader {
	searching: boolean;
	onChangeSearchText: RequiredOnChangeText['onChangeText'];
	theme: string;
	initSearch?: () => void;
	cancelSearch?: () => void;
}

export type IShareListHeaderIos = Required<IShareListHeader>;
