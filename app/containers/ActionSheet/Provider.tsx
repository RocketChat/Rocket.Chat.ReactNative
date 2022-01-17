import React, { ForwardedRef, forwardRef, useContext, useRef } from 'react';

import ActionSheet from './ActionSheet';
import { useTheme } from '../../theme';

interface IActionSheetProvider {
	Provider: any;
	Consumer: any;
}

const context: IActionSheetProvider = React.createContext({
	showActionSheet: () => {},
	hideActionSheet: () => {}
});

export const useActionSheet = () => useContext(context);

const { Provider, Consumer } = context;

export const withActionSheet = (Component: any): any =>
	forwardRef((props: any, ref: ForwardedRef<any>) => (
		<Consumer>{(contexts: any) => <Component {...props} {...contexts} ref={ref} />}</Consumer>
	));

export const ActionSheetProvider = React.memo(({ children }: { children: JSX.Element | JSX.Element[] }) => {
	const ref: ForwardedRef<any> = useRef();
	const { theme }: any = useTheme();

	const getContext = () => ({
		showActionSheet: (options: any) => {
			ref.current?.showActionSheet(options);
		},
		hideActionSheet: () => {
			ref.current?.hideActionSheet();
		}
	});

	return (
		<Provider value={getContext()}>
			<ActionSheet ref={ref} theme={theme}>
				<>{children}</>
			</ActionSheet>
		</Provider>
	);
});
