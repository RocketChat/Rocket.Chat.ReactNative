import React, { useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SafeAreaView from '../../containers/SafeAreaView';
import { useAppSelector } from '../../lib/hooks';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/HeaderButton';
import LoginServices from '../../containers/LoginServices';
import { MainParamList } from '../../stacks/types';
import {SwiperComponent} from './SwiperComponent'
import { View , Text} from 'react-native';
import Button from '../../containers/Button';
import { IBaseScreen } from 'definitions';
import { IApplicationState } from 'definitions';
import { connect } from 'react-redux';
import LoginReminder from '../../views/LoginReminder';
import Navigation from '../../lib/navigation/appNavigation'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { TopTabView } from './TopTabView';
import VerticalButtonList from './VerticalButtonList';
import NavigationContainer from '@react-navigation/native';
interface IMainProps extends IBaseScreen<MainParamList, 'MainView'> {
	user_id: string | undefined
    // handleOpenModal: () => void
}

interface IMainViewState {
    loginRemindOpen: boolean 
}

class MainView extends React.Component<IMainProps, IMainViewState> {
    constructor(props: IMainProps) {
        super(props);
        this.state = {
          loginRemindOpen: false,
        };
      }
    handleOpenModal = () => {
        if (!this.props.user_id){
            this.setState({ loginRemindOpen: true }); 
        } else {
            Navigation.navigate('Roomview');
        }
    };
    
    handleCloseModal = () => {
        this.setState({ loginRemindOpen: false });
    };


    cancelAction = () => {};
    render() 
    {
		const { user_id } = this.props;
        const { loginRemindOpen } = this.state;
        return (
        <SafeAreaView testID='Swiper-view'>
        <TopTabView user_id={user_id} handleOpenModal={this.handleOpenModal}/> 
    
        <LoginReminder
                visible={loginRemindOpen}
                onClose={this.handleCloseModal}
        />
        </SafeAreaView>
        );
    };
};
			

const mapStateToProps = (state: IApplicationState) => ({
    user_id: state.login.user._id
});

export default connect(mapStateToProps)(MainView);
