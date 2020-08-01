import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  isValidElement
} from 'react';
import PropTypes from 'prop-types';
import { Keyboard, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';
import Animated, {
  Extrapolate,
  interpolate,
  Value,
  Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useBackHandler } from '@react-native-community/hooks';

import { Header } from './Header';
import { UserItem } from './UserItem';
import { Handle } from './Handle';
import { themes } from '../../constants/colors';
import styles, { ITEM_HEIGHT } from './styles';
import { isTablet, isIOS } from '../../utils/deviceInfo';
import Separator from '../Separator';
import I18n from '../../i18n';
import { useOrientation, useDimensions } from '../../dimensions';
import { select } from 'redux-saga/effects';
const getItemLayout = (data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index });

const HANDLE_HEIGHT = isIOS ? 40 : 56;
const MAX_SNAP_HEIGHT = 16;
const CANCEL_HEIGHT = 64;

const ANIMATION_DURATION = 250;

const ANIMATION_CONFIG = {
	duration: ANIMATION_DURATION,
	// https://easings.net/#easeInOutCubic
	easing: Easing.bezier(0.645, 0.045, 0.355, 1.0)
};

const ReactionSheet = React.memo(forwardRef(({ children, theme }, ref) => {
  const bottomSheetRef = useRef();
	const [data, setData] = useState({});
	const [isVisible, setVisible] = useState(false);
	const [selected, setSelected] = useState({});
	const { height } = useDimensions();
	const { isLandscape } = useOrientation();
  
	const snaps = [height * 0.03, height];
	const openedSnapIndex = 0;
	const closedSnapIndex = snaps.length - 1;

  const toggleVisible = () => {
		setVisible(!isVisible);
		setSelected({});
	}
	const hide = () => {
		bottomSheetRef.current?.snapTo(closedSnapIndex);
	};

	const show = (newData) => {
		setData(newData);
    toggleVisible();
	};

	const onBackdropPressed = ({ nativeEvent }) => {
		if (nativeEvent.oldState === State.ACTIVE) {
			hide();
		}
	};

	useBackHandler(() => {
		if (isVisible) {
			hide();
		}
		return isVisible;
	});

  useEffect(() => {
		if (isVisible) {
			Keyboard.dismiss();
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			bottomSheetRef.current?.snapTo(openedSnapIndex);
		}
	}, [isVisible]);

	// Hides action sheet when orientation changes
	useEffect(() => {
		setVisible(false);
  }, [isLandscape]);
  
  useImperativeHandle(ref, () => ({
    showReactionSheet: show,
    hideReactionSheet: hide
  }));

	const renderHandle = useCallback(() => (
		<>
			<Handle theme={theme} />
		</>
	));

	const renderHeader = useCallback(() => (
		<>
			<Header theme={theme} data={data} setSelected={setSelected} selected={selected}/>
		</>
	));

	const renderItem = useCallback(({ item }) => <UserItem user={item} getCustomEmoji={data.getCustomEmoji} baseUrl={data.baseUrl} userId={data.user.id} userToken={data.user.token}/>);

  const animatedPosition = React.useRef(new Value(0));
	const opacity = interpolate(animatedPosition.current, {
		inputRange: [0, 1],
		outputRange: [0, 0.7],
		extrapolate: Extrapolate.CLAMP
	});

  return (
    <>
      {children}
      {isVisible && (
        <>
          <TapGestureHandler onHandlerStateChange={onBackdropPressed}>
            <Animated.View
              testID='reaction-sheet-backdrop'
              style={[
                styles.backdrop,
                {
                  backgroundColor: themes[theme].backdropColor,
                  opacity
                }
              ]}
            />
          </TapGestureHandler>
          <ScrollBottomSheet
						testID='reaction-sheet'
						ref={bottomSheetRef}
						componentType='FlatList'
						snapPoints={snaps}
						initialSnapIndex={closedSnapIndex}
						renderHandle={renderHandle}
						onSettle={index => (index === closedSnapIndex) && toggleVisible()}
						animatedPosition={animatedPosition.current}
						containerStyle={[
							styles.container,
							{ backgroundColor: themes[theme].focusedBackground },
							(isLandscape || isTablet) && styles.bottomSheet
						]}
						animationConfig={ANIMATION_CONFIG}
						// FlatList props
						data={selected.usernames}
						renderItem={renderItem}
						keyExtractor={item => item}
						style={{ backgroundColor: themes[theme].focusedBackground }}
						contentContainerStyle={styles.content}
						ListHeaderComponent={renderHeader}
						getItemLayout={getItemLayout}
						removeClippedSubviews={isIOS}
					/>
        </>
      )}
    </>
  );
}));

ReactionSheet.propTypes = {
  children: PropTypes.node,
  theme: PropTypes.string
};

export default ReactionSheet;