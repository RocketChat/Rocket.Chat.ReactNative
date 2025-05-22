import React, { useEffect, useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePickerOptions } from 'expo-image-picker';
import { SaveFormat, useImageManipulator } from 'expo-image-manipulator';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { RouteProp } from '@react-navigation/native';

import Cell from '../Cell';
import Row from '../Row';

// To Do:
// - Add Pinch detector;
// - Test horizontal device;
// - Organize code;
// - Adjust the layout;

// Components:
// - Grid;
// - EditTable;

// Hooks:
// - useImageManipulator;

const Grid = () => (
	<Animated.View style={animatedStyle}>
		<Row>
			<Cell gesture={topLeft} />
			<Cell gesture={topCenter} />
			<Cell gesture={topRight} />
		</Row>

		<Row>
			<Cell gesture={leftCenter} />
			<Cell gesture={moveGrid} />
			<Cell gesture={rightCenter} />
		</Row>

		<Row>
			<Cell gesture={bottomLeft} />
			<Cell gesture={bottomCenter} />
			<Cell gesture={bottomRight} />
		</Row>
	</Animated.View>
);

export default EditImageView;
