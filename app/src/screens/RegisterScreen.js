import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [city, setCity] = useState('');
    
    const { register, isLoading } = useContext(AuthContext);

    const handleRegister = async () => {
        if(!username || !email || !password || !city) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        try {
            await register(username, email, password, city);
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed';
            Alert.alert('Error', msg);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212"/>
            <ScrollView contentContainerStyle={styles.wrapper}>
                <Text style={styles.title}>Create Account</Text>
                
                <TextInput
                    style={styles.input}
                    value={username}
                    placeholder="Username"
                    placeholderTextColor="#666"
                    onChangeText={text => setUsername(text)}
                />

                <TextInput
                    style={styles.input}
                    value={email}
                    placeholder="Email"
                    placeholderTextColor="#666"
                    onChangeText={text => setEmail(text)}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    value={password}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    onChangeText={text => setPassword(text)}
                    secureTextEntry
                />

                <TextInput
                    style={styles.input}
                    value={city}
                    placeholder="City (e.g. Istanbul)"
                    placeholderTextColor="#666"
                    onChangeText={text => setCity(text)}
                />

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.buttonText}>Register</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.row}>
                    <Text style={{color: '#aaa'}}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    wrapper: {
        padding: 30,
        justifyContent: 'center',
        flexGrow: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 40,
        textAlign: 'center',
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

export default RegisterScreen;
