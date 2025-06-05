const React = require('react');

const GestureHandlerRootView = ({ children }) => children;

module.exports = {
  GestureHandlerRootView,
  PanGestureHandler: ({ children }) => children,
  TapGestureHandler: ({ children }) => children,
  FlingGestureHandler: ({ children }) => children,
  ForceTouchGestureHandler: ({ children }) => children,
  LongPressGestureHandler: ({ children }) => children,
  PinchGestureHandler: ({ children }) => children,
  RotationGestureHandler: ({ children }) => children,
  RawButton: ({ children }) => children,
  BaseButton: ({ children }) => children,
  RectButton: ({ children }) => children,
  BorderlessButton: ({ children }) => children,
  Swipeable: ({ children }) => children,
  DrawerLayout: ({ children }) => children,
  State: {},
  Directions: {},
  gestureHandlerRootHOC: jest.fn(),
  Gesture: {},
  GestureDetector: ({ children }) => children
};