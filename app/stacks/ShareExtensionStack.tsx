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

// Extension-only subset: InsideStack's ShareView params with callback fields made optional.
type ShareViewParams = Omit<InsideStackParamList['ShareView'], 'thread' | 'action' | 'finishShareView' | 'startShareView'> &
	Partial<Pick<InsideStackParamList['ShareView'], 'thread' | 'action' | 'finishShareView' | 'startShareView'>>;

// withNavigation(x as any) returns ComponentType<{}> — not assignable to ComponentType<StaticScreenProps<T>> — due to the
// type cycle: these components reference ShareInsideStackParamList ← StaticParamList<typeof ShareExtension> ← these components.
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

const ShareExtensionStack = ShareExtension.getComponent();

export default ShareExtensionStack;
