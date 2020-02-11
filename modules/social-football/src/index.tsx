import { createAppContainer, createNavigator, createSwitchNavigator } from 'react-navigation';

export const SocialFootballModule = createAppContainer(createSwitchNavigator(
    {
        LoginPage: {
            getScreen: () => require('./pages/LoginPage').default
        },
        TimelinePage: {
            getScreen: () => require('./pages/TimelinePage').default
        },
    },
    {
        initialRouteName: 'LoginPage'
    }
));
