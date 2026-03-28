import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';

export default function FriendsScreen() {
  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Friends List' }} />

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search friends by name..."
          style={styles.input}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.placeholderText}>
          Your friends will appear here once connected to Firebase.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  searchBox: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  content: {
    padding: 20,
  },
  placeholderText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
});