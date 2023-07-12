import { StackNavigationOptions } from '@react-navigation/stack';

interface INavigationProps {
	route?: any;
	navigation?: any;
	isMasterDetail?: boolean;
}

export type TNavigationOptions = {
	navigationOptions?(props: INavigationProps): StackNavigationOptions;
};
