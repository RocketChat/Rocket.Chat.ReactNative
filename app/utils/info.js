import { Alert } from 'react-native';

export const showAlert = (message: string) => Alert.alert( null, message, [{ text: 'OK', onPress: () => {} }], { cancelable: true });

export const showErrorAlert = (message: string, title: string) => Alert.alert(title, message, [{ text: 'OK', onPress: () => {} }], { cancelable: true });
