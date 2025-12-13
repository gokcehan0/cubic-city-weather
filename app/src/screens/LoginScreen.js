import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useContext(AuthContext);

    const handleLogin = async () => {
        if(!email || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        try {
            await login(email, password);
        } catch (error) {
           const msg = error.response?.data?.message || 'Login failed';
           Alert.alert('Login Error', msg);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212"/>
            <View style={styles.wrapper}>
                <Text style={styles.title}>Weather AI</Text>
                
                <TextInput
                    style={styles.input}
                    value={email}
                    placeholder="Email"
                    placeholderTextColor="#666"
                    onChangeText={text => setEmail(text)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    value={password}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    onChangeText={text => setPassword(text)}
                    secureTextEntry
                />

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.row}>
                    <Text style={{color: '#aaa'}}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.link}>Register</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#121212', // Dark Dark
    },
    wrapper: {
        padding: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 40,
        textAlign: 'center',
        letterSpacing: 1,
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 15,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333',
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        marginTop: 30,
        justifyContent: 'center',
    },
    link: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
        textDecorationLine: 'underline',
    },
});

export default LoginScreen;
