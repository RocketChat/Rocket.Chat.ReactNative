
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
import Navigation from '../../lib/navigation/appNavigation'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { CustomIcon } from '../../containers/CustomIcon';
import DrawerNavigator from './DrawerStack';
import NavigationContainer from '@react-navigation/native';
interface TopTabProps {
	user_id: string | undefined
  handleOpenModal: () => void
}

const Tab = createMaterialTopTabNavigator();
function Feature() {
  
}
export const TopTabView: React.FC<TopTabProps> = ({ user_id, handleOpenModal }: TopTabProps) => {
    return (
        <Tab.Navigator initialRouteName='feature'>
          <Tab.Screen name='menu' component={DrawerNavigator} 
          />
           {/* @ts-ignore */}
          <Tab.Screen name="feature" component={SwiperComponent} 
          initialParams={{userId: user_id, onRemindLogin: handleOpenModal, is_hot: 0}}
          options={{
          tabBarLabel: '精选',
        }}>
          </Tab.Screen>
          
          
          {/* @ts-ignore */}
          <Tab.Screen name="hot" component={SwiperComponent} 
          initialParams={{userId: user_id, onRemindLogin: handleOpenModal, is_hot: 1}}
          options={{
          tabBarLabel: '热点',
        }}>
          </Tab.Screen>
        
        </Tab.Navigator>
        )
      }
  

  const mapStateToProps = (state: IApplicationState) => ({
      user_id: state.login.user._id
  });
  
export default connect(mapStateToProps)(TopTabView);
  