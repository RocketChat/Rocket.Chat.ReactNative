import React, { forwardRef } from 'react';

export const SafeAreaView = ({ children }) => <>{children}</>;
export const createSwitchNavigator = jest.fn();
export const createStackNavigator = jest.fn();
export const createAppContainer = () => forwardRef((props, ref) => <>{props?.children}</>);
