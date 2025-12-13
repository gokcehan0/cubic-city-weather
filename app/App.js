import React, { useContext } from 'react';
import { Button, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext, AuthProvider } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createStackNavigator();

const AppNav = () => {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );    
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {userToken === null ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // App Stack
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNav />
    </AuthProvider>
  );
}
