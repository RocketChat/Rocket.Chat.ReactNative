import React from 'react';
import { Pressable, PressableProps, Platform } from 'react-native';

interface PlatformPressableProps extends PressableProps {
  children: React.ReactNode;
}

const PlatformPressable: React.FC<PlatformPressableProps> = ({
  children,
  style,
  disabled,
  ...props
}) => (
  <Pressable
    {...props}
    disabled={disabled}
    style={({ pressed }) => {
      let pressStyle = {};
      if (pressed && !disabled) {
        if (Platform.OS === 'ios') {
          pressStyle = { opacity: 0.7 };
        } else {
          pressStyle = { opacity: 0.8 };
        }
      }

      if (typeof style === 'function') {
        return [style({ pressed }), pressStyle];
      }
      return [style, pressStyle];
    }}
  >
    {children}
  </Pressable>
);

export default PlatformPressable;