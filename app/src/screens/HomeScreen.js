import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Dimensions, TouchableOpacity, Alert, ScrollView, FlatList, StatusBar, Modal, TextInput, NativeModules, Linking, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { Ionicons } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const { logout, userInfo, userToken, updateUser } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // For Pull-to-Refresh

    const fetchWidgetData = async (force = false, explicitCity = null) => {
        // If we have data and it's not a forced update or explicit city change, skip
        // Actually, we want to allow silent background updates
        if (!userInfo?.city && !explicitCity) return;
        
        try {
            // Only show full screen loader on initial load (when no data exists)
            if (!data && !refreshing) setLoading(true);

            // Use client to fetch (auth header added automatically)
            // Add timestamp to prevent caching if force=true
            const url = `/users/widget-image?t=${Date.now()}`; 
            const res = await client.get(url);
            
            // If explicit city was requested, but valid, we assume backend handles it based on user choice
            setData(res.data);
            
            // Send data to Android Widget
            if (res.data) {
                const currentCity = explicitCity || userInfo?.city || 'City';
                const weatherIcon = res.data.weather?.icon || '01d';
                
                const widgetData = {
                    city: currentCity,
                    temp: res.data.weather?.temp ? Math.round(res.data.weather.temp).toString() : '--',
                    imageUrl: res.data.imageUrl ? res.data.imageUrl.replace(/http:\/\/(localhost|10\.0\.2\.2|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?/, 'https://cubic-weather-api.onrender.com') : '',
                    iconUrl: `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`
                };
                
                try {
                    const { WidgetDataModule } = NativeModules;
                    if (WidgetDataModule) {
                        WidgetDataModule.updateWidgetData(JSON.stringify(widgetData));
                    }
                } catch (e) {
                    console.log('Widget update error:', e);
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch weather data');
        } finally {
            setLoading(false);
            setRefreshing(false); // Stop refreshing indicator
        }
    };

    // Initial Load & Auto Refresh Interval
    useEffect(() => {
        fetchWidgetData();
        
        // Auto Refresh every 10 minutes (600,000 ms)
        const intervalId = setInterval(() => {
            console.log("Auto-refreshing weather data...");
            fetchWidgetData(true);
        }, 600000);

        return () => clearInterval(intervalId); // Cleanup
    }, []);

    // Handle Pull to Refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchWidgetData(true);
    }, []);

    const handleLogout = () => {
        logout();
    };

    const handleCityUpdate = async (cityData) => {
        const cityName = cityData.local_names?.tr || cityData.name; // Türkçe isim varsa onu kullan
        
        try {
            const config = {
                headers: { Authorization: `Bearer ${userToken}` }
            };
            await client.put('/users/city', { city: cityName }, config);
            
            setCityModalVisible(false);
            setSearchText('');
            setCitySuggestions([]);
            
            
            // Kullanıcı bilgisini güncelle ve kalıcı olarak kaydet
            await updateUser({ city: cityName });
            
            // Reset image loading state
            setImageLoading(true);
            
            // Yeni şehrin resmini çek (varsa bugünün cache'ini kullan)
            fetchWidgetData(false, cityName);
            
            Alert.alert('Success', `City changed to ${cityName}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update city');
        }
    };

    useEffect(() => {
        fetchWidgetData(false);
    }, []);

    const renderForecastItem = ({ item }) => (
        <View style={styles.forecastItem}>
            <Text style={styles.forecastDay}>{item.day}</Text>
            <Image 
                source={{ uri: `https://openweathermap.org/img/wn/${item.icon || '01d'}@2x.png` }} 
                style={styles.forecastIcon} 
            />
            <Text style={styles.forecastTemp}>{item.max}° / <Text style={styles.minTemp}>{item.min}°</Text></Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setCityModalVisible(true)} style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View>
                        <Text style={styles.cityText}>{userInfo?.city}</Text>
                        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
                    </View>
                    <Ionicons name="create-outline" size={20} color="#fff" style={{marginLeft: 10}} />
                </TouchableOpacity>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#fff"
                        colors={["#FF6B35"]} 
                    />
                }
            >
                {loading && !data ? (
                     <ActivityIndicator size="large" color="#fff" style={{marginTop: 50}} />
                ) : (
                    <>
                        {/* Main Image Section with Weather Overlay */}
                        {data?.imageUrl && (
                            <View style={styles.imageCard}>
                                <Image 
                                    source={{ 
                                        uri: data.imageUrl.replace(/http:\/\/(localhost|10\.0\.2\.2|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?/, 'https://cubic-weather-api.onrender.com'),
                                        cache: 'default'
                                    }} 
                                    style={styles.mainImage}
                                    resizeMode="cover"
                                    onLoadStart={() => setImageLoading(true)}
                                    onLoad={() => setImageLoading(false)}
                                    onError={(error) => {
                                        console.log('Original URL:', data.imageUrl);
                                        console.error('Image loading error:', error.nativeEvent.error);
                                        setImageLoading(false);
                                    }}
                                />
                                {/* Loading Indicator */}
                                {imageLoading && (
                                    <View style={styles.imageLoadingOverlay}>
                                        <ActivityIndicator size="large" color="#fff" />
                                    </View>
                                )}
                                {/* Weather Overlay */}
                                {data?.weather && !imageLoading && (
                                    <View style={styles.weatherOverlay}>
                                        <Text style={styles.overlayCity}>{userInfo?.city}</Text>
                                        <Text style={styles.overlayTemp}>{data.weather.temp}°</Text>
                                        <Text style={styles.overlayCondition}>{data.weather.description}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Current Weather Details */}
                        {data?.weather && (
                            <View style={styles.weatherDetailsContainer}>
                                <Text style={styles.detailsTitle}>Current Weather</Text>
                                <View style={styles.detailsRow}>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="water-outline" size={20} color="#4A9EFF" />
                                        <Text style={styles.detailLabel}>Rain</Text>
                                        <Text style={styles.detailValue}>{data.weather.rain_prob}%</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="speedometer-outline" size={20} color="#4A9EFF" />
                                        <Text style={styles.detailLabel}>Wind</Text>
                                        <Text style={styles.detailValue}>{data.weather.wind_speed} m/s</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="sunny-outline" size={20} color="#FFB84D" />
                                        <Text style={styles.detailLabel}>Sunrise</Text>
                                        <Text style={styles.detailValue}>{data.weather.sunrise}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="moon-outline" size={20} color="#FFB84D" />
                                        <Text style={styles.detailLabel}>Sunset</Text>
                                        <Text style={styles.detailValue}>{data.weather.sunset}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Forecast Section - Vertical */}
                        <Text style={styles.sectionTitle}>7-Day Forecast</Text>
                        <View style={styles.forecastContainer}>
                            {data?.weather?.forecast ? (
                                data.weather.forecast.map((item, index) => (
                                    <View key={index} style={styles.forecastItemVertical}>
                                        <View style={styles.forecastLeft}>
                                            <Text style={styles.forecastDay}>{item.day}</Text>
                                            <Text style={styles.forecastDate}>{item.date}</Text>
                                        </View>
                                        <Image 
                                            source={{ uri: `https://openweathermap.org/img/wn/${item.icon || '01d'}@2x.png` }} 
                                            style={styles.forecastIconVertical} 
                                        />
                                        <View style={styles.forecastCenter}>
                                            <Text style={styles.forecastTemp}>{item.max}° / <Text style={styles.minTemp}>{item.min}°</Text></Text>
                                            <Text style={styles.forecastDescription}>{item.description}</Text>
                                        </View>
                                        <View style={styles.forecastRight}>
                                            <View style={styles.forecastDetail}>
                                                <Ionicons name="water-outline" size={14} color="#4A9EFF" />
                                                <Text style={styles.forecastDetailText}>{item.rain_prob}%</Text>
                                            </View>
                                            <View style={styles.forecastDetail}>
                                                <Ionicons name="speedometer-outline" size={14} color="#888" />
                                                <Text style={styles.forecastDetailText}>{item.wind_speed} m/s</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={{color: '#888', textAlign: 'center'}}>Forecast unavailable</Text>
                            )}
                        </View>

                        {/* OpenWeather 30-Day Link */}
                        {data?.weather?.city_id && (
                            <TouchableOpacity 
                                style={styles.openWeatherBtn}
                                onPress={() => {
                                    const url = `https://openweathermap.org/city/${data.weather.city_id}`;
                                    // Open in browser
                                    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
                                }}
                            >
                                <Ionicons name="globe-outline" size={20} color="#fff" />
                                <Text style={styles.openWeatherText}>View 30-Day Forecast on OpenWeather</Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>

            {/* City Search Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={cityModalVisible}
                onRequestClose={() => {
                    setCityModalVisible(false);
                    setSearchText('');
                    setCitySuggestions([]);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Search City</Text>
                            <TouchableOpacity onPress={() => {
                                setCityModalVisible(false);
                                setSearchText('');
                                setCitySuggestions([]);
                            }}>
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#666" style={{marginRight: 10}} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Type city name (e.g. Istanbul, London)"
                                placeholderTextColor="#aaa"
                                underlineColorAndroid="transparent"
                                value={searchText}
                                onChangeText={searchCities}
                                autoFocus
                            />
                        </View>

                        <ScrollView style={styles.suggestionsContainer}>
                            {searching && <ActivityIndicator color="#fff" style={{marginTop: 20}} />}
                            
                            {citySuggestions.map((city, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.suggestionItem}
                                    onPress={() => selectCity(city)}
                                >
                                    <Ionicons name="location-outline" size={20} color="#fff" />
                                    <View style={{marginLeft: 15, flex: 1}}>
                                        <Text style={styles.cityName}>{city.local_names?.tr || city.name}</Text>
                                        <Text style={styles.cityCountry}>{city.state ? `${city.state}, ` : ''}{city.country}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            
                            {!searching && searchText.length >= 2 && citySuggestions.length === 0 && (
                                <Text style={{color: '#888', textAlign: 'center', marginTop: 20}}>No cities found</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        alignItems: 'center',
    },
    cityText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    dateText: {
        fontSize: 14,
        color: '#aaa',
    },
    logoutBtn: {
        padding: 5,
        backgroundColor: '#333',
        borderRadius: 50,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    imageCard: {
        width: width * 0.75,
        height: (width * 0.75) * (4/3),
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
        backgroundColor: '#1e1e1e',
        alignSelf: 'center',
        marginBottom: 20,
        position: 'relative', // For overlay positioning
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imageLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    weatherOverlay: {
        position: 'absolute',
        top: 25,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    overlayCity: {
        fontSize: 18,
        fontWeight: '400',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        letterSpacing: 1,
        marginBottom: 10,
    },
    overlayTemp: {
        fontSize: 56,
        fontWeight: '200', // Very thin font
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        letterSpacing: 2,
    },
    overlayCondition: {
        fontSize: 14,
        fontWeight: '300',
        color: '#fff',
        textTransform: 'capitalize',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        letterSpacing: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 20,
        marginBottom: 15,
    },
    forecastContainer: {
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    weatherDetailsContainer: {
        backgroundColor: '#1e1e1e',
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#333',
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        color: '#888',
        fontSize: 12,
        marginTop: 5,
    },
    detailValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 2,
    },
    forecastItemVertical: {
        backgroundColor: '#1e1e1e',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
    },
    forecastLeft: {
        flex: 1,
    },
    forecastCenter: {
        flex: 2,
        marginHorizontal: 10,
    },
    forecastRight: {
        alignItems: 'flex-end',
    },
    forecastIconVertical: {
        width: 50,
        height: 50,
    },
    forecastDate: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    forecastDescription: {
        color: '#888',
        fontSize: 12,
        textTransform: 'capitalize',
        marginTop: 2,
    },
    forecastDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    forecastDetailText: {
        color: '#888',
        fontSize: 12,
        marginLeft: 4,
    },
    openWeatherBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B35',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 15,
        borderRadius: 12,
        gap: 10,
    },
    openWeatherText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    forecastItem: {
        backgroundColor: '#1e1e1e',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        marginHorizontal: 8,
        width: 100,
        borderWidth: 1,
        borderColor: '#333',
    },
    forecastDay: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 5,
    },
    forecastIcon: {
        width: 40,
        height: 40,
        marginBottom: 5,
    },
    forecastTemp: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    minTemp: {
        color: '#666',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'flex-start',
        paddingTop: 60,
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121212',
        margin: 20,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    suggestionsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#121212',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    cityName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cityCountry: {
        color: '#888',
        fontSize: 13,
        marginTop: 2,
    },
});

export default HomeScreen;
