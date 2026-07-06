import { useContext, type ComponentType } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { type StaticParamList, type StaticScreenProps } from '@react-navigation/native';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
import SelectServerView from '../views/SelectServerView';
import ShareListView from '../views/ShareListView';
import ShareView from '../views/ShareView';
import withNavigation from '../lib/navigation/withNavigation';
import { type InsideStackParamList } from './types';
import { type Optional } from '../definitions/utils';

type ShareViewParams = Optional<InsideStackParamList['ShareView'], 'thread' | 'action' | 'finishShareView' | 'startShareView'>;

// Cast through `any` to break the navigation-prop type cycle; removing it reintroduces a real TS circular ref.
const ShareListViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(ShareListView as any) as any;
const ShareViewScreen: ComponentType<StaticScreenProps<ShareViewParams>> = withNavigation(ShareView as any) as any;

const ShareExtension = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		ShareListView: ShareListViewScreen,
		ShareView: ShareViewScreen,
		SelectServerView
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

export type ShareInsideStackParamList = StaticParamList<typeof ShareExtension>;

export default ShareExtension;
