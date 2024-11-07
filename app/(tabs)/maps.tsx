import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, Text, View, Dimensions, Button} from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

// react native maps
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Marker } from 'react-native-maps';

// react native permissions
// import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

// react native geo location service
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';

// async storage to store data locally
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function MapsScreen() {
  // location state
  // const [location, setLocation] = useState<GeoPosition | null>(null);
  // const [errorMsg, setErrorMsg] = useState('');

  // location state
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  // const [errorMsg, setErrorMsg] = useState('');
  // error state
  const [errorMsg, setErrorMsg] = useState<string>('');
  // trip data state
  const [tripData, setTripData] = useState<any[]>([]);
  // record state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  // location subscription state
  const [subscription, setSubscription] = useState<any>(null);

  // get permission for user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      console.log("Init location");
      console.log(currentLocation);
      setLocation(currentLocation);
    })();
  }, []);

  // record trip data
  const startRecording = async () => {
    console.log("Trip recording started");

    if (!isRecording) {
      const newSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (loc) => {
          if (loc && loc.coords) {
            setLocation(loc);
            // print location
            console.log(loc);
            setTripData((prevTripData) => [
              ...prevTripData,
              {
                timestamp: loc.timestamp,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                speed: loc.coords.speed,
              },
            ]);
          }
        }
      );
      setSubscription(newSubscription);
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    console.log("Recording stopped");

    if (isRecording && subscription) {
      subscription.remove();
      setSubscription(null);
      setIsRecording(false);
      
      await AsyncStorage.setItem('tripData', JSON.stringify(tripData));
    }
  };


  return (
    <View style={styles.container}>
      {/* Check for error message */}
      {errorMsg ? (
        <Text>{errorMsg}</Text>
      ) : location ? (
        // else display map with user location
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
              description="You are here"
            />
          </MapView>
          <View style={styles.buttonContainer}>
            <Button
              title={isRecording ? 'End Trip' : 'Start Trip'}
              onPress={isRecording ? stopRecording : startRecording}
            />
          </View>

          {/* <View style={styles.buttonContainer}>
            {!isRecording && (
              <Button
                title={isRecording ? 'End Trip' : 'Start Trip'}
                onPress={isRecording ? stopRecording : startRecording}
              />
            )}
          
            {/* {isRecording && (
              // <Button title="Upload Trip Data" onPress={uploadTripData} />
              <Button title="End Trip" />
            )} 
          </View> */}
        </>
      ) : (
        <Text>Waiting for location...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '35%',
    backgroundColor: 'white',
    borderRadius: 10,
  },
});