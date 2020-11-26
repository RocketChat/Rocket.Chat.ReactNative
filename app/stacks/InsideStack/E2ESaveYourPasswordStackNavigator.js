import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import E2ESaveYourPasswordView from "../views/E2ESaveYourPasswordView";
import E2EHowItWorksView from "../views/E2EHowItWorksView";

const E2ESaveYourPasswordStack = createStackNavigator();
const E2ESaveYourPasswordStackNavigator = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <E2ESaveYourPasswordStack.Navigator
      screenOptions={{
        ...defaultHeader,
        ...themedHeader(theme),
        ...StackAnimation,
      }}
    >
      <E2ESaveYourPasswordStack.Screen
        name="E2ESaveYourPasswordView"
        component={E2ESaveYourPasswordView}
        options={E2ESaveYourPasswordView.navigationOptions}
      />
      <E2ESaveYourPasswordStack.Screen
        name="E2EHowItWorksView"
        component={E2EHowItWorksView}
        options={E2EHowItWorksView.navigationOptions}
      />
    </E2ESaveYourPasswordStack.Navigator>
  );
};

export default E2ESaveYourPasswordStackNavigator;
