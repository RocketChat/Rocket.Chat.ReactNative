// import { Answers } from 'react-native-fabric';

export default (event, error) => {
  if (typeof error !== "object") {
    error = { error };
  }
  console.log(event, error);
  if (__DEV__) {
    console.warn(event, error);
  }
};
