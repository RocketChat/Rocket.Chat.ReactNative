import {
	createNavigatorFactory,
	type DefaultNavigatorOptions,
	type ParamListBase,
	type TabNavigationState,
	TabRouter,
	type TabRouterOptions,
	useNavigationBuilder
} from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import { MAX_SIDEBAR_WIDTH } from '~/lib/constants/tablet';
import { useTheme } from '~/theme';

const popMasterStack = (state: TabNavigationState<ParamListBase>) => {
	const [master, ...details] = state.routes;
	const masterStack = master.state;
	if (masterStack?.stale !== false || masterStack.routes.length < 2) {
		return null;
	}
	const routes = masterStack.routes.slice(0, -1);
	return { ...state, routes: [{ ...master, state: { ...masterStack, routes, index: routes.length - 1 } }, ...details] };
};

const DetailFocusedRouter = (options: TabRouterOptions): ReturnType<typeof TabRouter> => {
	const router = TabRouter({ ...options, backBehavior: 'none' });
	return {
		...router,
		getStateForAction(state, action, configOptions) {
			if (action.type === 'GO_BACK') {
				return popMasterStack(state);
			}
			const nextState = router.getStateForAction(state, action, configOptions);
			if (nextState === null || nextState.index === state.index) {
				return nextState;
			}
			return { ...nextState, index: state.index };
		},
		getStateForRouteFocus(state) {
			return state;
		}
	};
};

type SplitNavigatorProps = DefaultNavigatorOptions<
	ParamListBase,
	string | undefined,
	TabNavigationState<ParamListBase>,
	{},
	{},
	any
> &
	TabRouterOptions;

const SplitNavigator = ({ id, initialRouteName, children, layout, screenListeners, screenOptions }: SplitNavigatorProps) => {
	const { colors } = useTheme();
	const { state, descriptors, NavigationContent } = useNavigationBuilder(DetailFocusedRouter, {
		id,
		initialRouteName,
		children,
		layout,
		screenListeners,
		screenOptions
	});
	const [master, ...details] = state.routes;

	return (
		<NavigationContent>
			<View style={styles.container}>
				<View style={[styles.master, { borderColor: colors.strokeLight }]}>{descriptors[master.key].render()}</View>
				{details.map(route => (
					<View key={route.key} style={styles.detail}>
						{descriptors[route.key].render()}
					</View>
				))}
			</View>
		</NavigationContent>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row'
	},
	master: {
		width: MAX_SIDEBAR_WIDTH,
		borderEndWidth: StyleSheet.hairlineWidth
	},
	detail: {
		flex: 1
	}
});

export const createSplitNavigator = createNavigatorFactory(SplitNavigator);
