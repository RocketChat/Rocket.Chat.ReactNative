// commonly used react native types
type ViewStyle = import('react-native').ViewStyle
type StyleProp<T=ViewStyle> = import('react-native').StyleProp<T>

// Commonly used redux types
type Action<T = string> = import('redux').Action<T>
type Dispatch<T> = import('redux').Dispatch<T>

// custom redux types
type ReduxState = import('./reducers/types').ReduxState

// global types
// eslint-disable-next-line no-unused-vars
declare const alert: (x: string) => void;
