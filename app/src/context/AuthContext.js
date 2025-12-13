import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await client.post('/auth/login', {
                email,
                password
            });
            const { token, ...user } = response.data;
            
            setUserInfo(user);
            setUserToken(token);
            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
            
        } catch (error) {
            // Rethrow to handle UI on screen (show alert)
            throw error; 
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username, email, password, city) => {
        setIsLoading(true);
        try {
            const response = await client.post('/auth/register', {
                username,
                email,
                password,
                city
            });
            const { token, ...user } = response.data;

            setUserInfo(user);
            setUserToken(token);
            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Call backend to blacklist token (Best effort)
            if (userToken) {
                await client.post('/auth/logout', {}, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
            }
        } catch (error) {
            // Ignore logout errors (e.g. invalid token), just clear local state
        }
        
        setIsLoading(true);
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userInfo');
        setUserToken(null);
        setUserInfo(null);
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let userToken = await SecureStore.getItemAsync('userToken');
            let userInfo = await SecureStore.getItemAsync('userInfo');
            
            if (userToken) {
                setUserToken(userToken);
                setUserInfo(JSON.parse(userInfo));
            }
        } catch (e) {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const updateUser = async (newUserData) => {
        try {
            // Merge with existing data
            const updatedUser = { ...userInfo, ...newUserData };
            
            setUserInfo(updatedUser);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(updatedUser));
            console.log('User info updated and persisted:', newUserData);
        } catch (error) {
            console.error('Failed to update user info:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ login, register, logout, updateUser, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
