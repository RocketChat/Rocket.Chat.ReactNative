import { createBottomTabNavigator } from "react-navigation";

const CoreMainNavigator = modules => {
  const RootNavigator = createBottomTabNavigator(modules);

  return RootNavigator;
};

export default CoreMainNavigator;
