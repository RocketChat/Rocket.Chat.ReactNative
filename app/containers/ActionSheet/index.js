import React, {
	useRef,
	useState,
	forwardRef,
	useImperativeHandle
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard } from 'react-native';
import { Modalize } from 'react-native-modalize';
import * as Haptics from 'expo-haptics';

import Item from './Item';

import Separator from '../Separator';
import { themes } from '../../constants/colors';
import styles from './styles';
import Header from './Header';
import Footer from './Footer';

const ActionSheet = forwardRef(({ children, theme }, ref) => {
	const modalizeRef = useRef();
	const [data, setData] = useState({});

	const hide = () => {
		modalizeRef.current?.close();
	};

	const show = (options) => {
		Keyboard.dismiss();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setData(options);
		modalizeRef.current?.open();
	};

	useImperativeHandle(ref, () => ({
		show,
		hide
	}));

	const renderFooter = () => (data?.hasCancel ? (
		<Footer
			hide={hide}
			theme={theme}
		/>
	) : null);

	const renderHeader = () => (data?.title ? (
		<Header
			title={data?.title}
			theme={theme}
		/>
	) : data?.customHeader);

	return (
		<>
			{children}
			<Modalize
				ref={modalizeRef}
				adjustToContentHeight
				handleStyle={{ backgroundColor: themes[theme].auxiliaryText }}
				modalStyle={[styles.modal, { backgroundColor: themes[theme].backgroundColor }]}
				HeaderComponent={renderHeader}
				FooterComponent={renderFooter}
				handlePosition='inside'
				flatListProps={{
					data: data?.options,
					// eslint-disable-next-line react/prop-types
					renderItem: ({ item }) => (
						<Item
							item={item}
							onPress={() => {
								// eslint-disable-next-line react/prop-types
								item.onPress();
								hide();
							}}
							theme={theme}
						/>
					),
					style: { backgroundColor: themes[theme].backgroundColor },
					contentContainerStyle: styles.content,
					ListHeaderComponent: () => <Separator theme={theme} />,
					ItemSeparatorComponent: () => <Separator theme={theme} />,
					nestedScrollEnabled: true
				}}
			/>
		</>
	);
});
ActionSheet.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};

export default ActionSheet;
