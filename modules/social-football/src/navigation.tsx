import React, { forwardRef, useEffect, useState } from 'react';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import SecurityManager from './security/security-manager';
import i18n from './i18n';
import { appColors } from './theme/colors';
import { HeaderLogo } from './components/header/HeaderLogo';
import { HeaderCreateThreadButton } from './components/header/HeaderCreateThreadButton';
import { HeaderSaveThreadButton } from './components/header/HeaderSaveThreadButton';

export const pages = {
    unauthenticated: {
        LoginPage: {
            getScreen: () => require('./pages/LoginPage').default
        },
        RegisterPage: {
            getScreen: () => require('./pages/RegisterPage').default
        }
    },
    authenticated: {
        TimelinePage: {
            getScreen: () => require('./pages/TimelinePage').default,
        },
        CreateThreadPage: {
            getScreen: () => require('./pages/CreateThreadPage').default,
        },
    },
    loading: {
        LoadingPage: {
            getScreen: () => require('./pages/LoadingPage').default
        },
    },
};

export const UnaunthenticatedNavigation: any = createAppContainer(createStackNavigator(
    pages.unauthenticated,
    {
        initialRouteName: 'LoginPage',
        headerMode: 'none',
    }
));

export const LoadingNavigation: any = createAppContainer(createSwitchNavigator(
    pages.loading,
    {
        initialRouteName: 'LoadingPage',
    }
));

export const AuthenticatedNavigation: any = createAppContainer(createStackNavigator(
    pages.authenticated,
    {
        initialRouteName: 'TimelinePage',
        defaultNavigationOptions: {
            headerBackTitle: i18n.t('navigation.back'),
            headerStyle: {
                backgroundColor: appColors.primary,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontFamily: 'Cabin-SemiBold'
            },
            headerBackTitleStyle: {
                fontFamily: 'Cabin-SemiBold'
            },
        },
    }
));

const styles = StyleSheet.create({
    activityHolder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    }
});

export const Navigation = forwardRef((props, ref) => {
    const [login, setLogin] = useState<boolean|null>(null);

    useEffect(() => {
        SecurityManager.login$.subscribe(value => {
            setLogin(value);
        });
    }, []);

    return <>
        {login === null ? <LoadingNavigation ref={ref} /> : (
                !login
            ?
                <UnaunthenticatedNavigation ref={ref} />
            :
                <AuthenticatedNavigation ref={ref} />
        )}
    </>
});
