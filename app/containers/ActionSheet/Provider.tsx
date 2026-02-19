import hoistNonReactStatics from 'hoist-non-react-statics';
import {
	type ComponentType,
	createContext,
	createRef,
	type ForwardedRef,
	forwardRef,
	memo,
	type ReactElement,
	type Ref,
	useContext
} from 'react';
import { type AccessibilityRole } from 'react-native';

import { type TIconsName } from '../CustomIcon';
import ActionSheet from './ActionSheet';

export type TActionSheetOptionsItem = {
	title: string;
	subtitle?: string;
	accessibilityLabel?: string;
	icon?: TIconsName;
	danger?: boolean;
	testID?: string;
	onPress: () => void;
	right?: () => ReactElement;
	enabled?: boolean;
	accessibilityRole?: AccessibilityRole;
	disabledReason?: string;
};

export type TActionSheetOptions = {
	options?: TActionSheetOptionsItem[];
	headerHeight?: number;
	customHeader?: ReactElement | null;
	hasCancel?: boolean;
	// children can both use snaps or dynamic
	children?: ReactElement | null;
	/** Required if your action sheet needs vertical scroll */
	snaps?: (string | number)[];
	onClose?: () => void;
	enableContentPanningGesture?: boolean;
};
export interface IActionSheetProvider {
	showActionSheet: (item: TActionSheetOptions) => void;
	hideActionSheet: () => void;
}

const context = createContext<IActionSheetProvider>({
	showActionSheet: () => {},
	hideActionSheet: () => {}
});

export const useActionSheet = () => useContext(context);

const { Provider, Consumer } = context;

export const withActionSheet = (Component: ComponentType<any>): typeof Component => {
	const WithActionSheetComponent = forwardRef((props: typeof Component, ref: ForwardedRef<IActionSheetProvider>) => (
		<Consumer>{(contexts: IActionSheetProvider) => <Component {...props} {...contexts} ref={ref} />}</Consumer>
	));

	hoistNonReactStatics(WithActionSheetComponent as any, Component as any);
	return WithActionSheetComponent;
};

const actionSheetRef: Ref<IActionSheetProvider> = createRef();

export const ActionSheetProvider = memo(({ children }: { children: ReactElement | ReactElement[] }) => {
	'use memo';

	const getContext = (): IActionSheetProvider => ({
		showActionSheet: options => {
			actionSheetRef.current?.showActionSheet(options);
		},
		hideActionSheet: () => {
			actionSheetRef.current?.hideActionSheet();
		}
	});

	return (
		<Provider value={getContext()}>
			<ActionSheet ref={actionSheetRef}>
				<>{children}</>
			</ActionSheet>
		</Provider>
	);
});

export const showActionSheetRef: IActionSheetProvider['showActionSheet'] = options => {
	actionSheetRef?.current?.showActionSheet(options);
};

export const hideActionSheetRef: IActionSheetProvider['hideActionSheet'] = () => {
	actionSheetRef?.current?.hideActionSheet();
};
