import { Alert } from "react-native";
// import Toast from '@remobile/react-native-toast';

export const showToast = message =>
  Alert.alert(
    "title",
    message,
    [
      {
        text: "OK",
        onPress: () => {
          console.log("OK Pressed");
        }
      }
    ],
    {
      cancelable: true
    }
  );

export const showErrorAlert = (message, title) =>
  Alert.alert(title, message, [{ text: "OK", onPress: () => {} }], {
    cancelable: true
  });
