import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export type OutsideStackParamList = {
  OnboardingView: undefined;
  NewServerView: {previousServer: string} | undefined;
  WorkspaceView: undefined;
  LoginView: undefined;
  ForgotPasswordView: undefined;
  RegisterView: undefined;
  LegalView: undefined;
};

export interface OutsideNavProps<T extends keyof OutsideStackParamList> {
  navigation: StackNavigationProp<OutsideStackParamList, T>;
  route: RouteProp<OutsideStackParamList, T>;
}
