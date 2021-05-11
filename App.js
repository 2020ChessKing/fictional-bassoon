import React from 'react';
import WelcomeScreen from './Screens/welcomeScreen.js';
import { createSwitchNavigator, createAppContainer } from 'react-navigation';
import { DrawerNavigator } from './Components/Drawer-Tab.js'

export default function App() {
  return ( <AppContainer/> );
}

const StackNavigator = createSwitchNavigator(
  {
    WelcomeScreen : { screen : WelcomeScreen },
    DrawerNavigator : { screen : DrawerNavigator },
  }
);

const AppContainer = createAppContainer( StackNavigator );