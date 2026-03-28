import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useBookings } from '../../../hooks/useBookings';
import { cancelBookingService } from '../../../services/bookingService';
import BookingCard from '../../../components/BookingCard';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { auth } from '../../../services/firebaseConfig';

export default function BookingScreen() {
  const currentUserId = auth.currentUser?.uid || null;

  const { bookings, loading } = useBookings(currentUserId);
  const [activeTab, setActiveTab] = useState('verse');
  const [cancelTarget, setCancelTarget] = useState(null);

  const filteredBookings = bookings.filter((item) =>
    activeTab === 'verse'
      ? item.type === 'verse' || !item.type
      : item.type === 'tournament'
  );

  const handleCancel = async () => {
    if (!cancelTarget?.bookingId) return;

    try {
      await cancelBookingService(cancelTarget.bookingId);
      setCancelTarget(null);
      Alert.alert('Success', 'Booking cancelled.');
    } catch (error) {
      Alert.alert('Error', 'Could not cancel booking.');
    }
  };

  if (!currentUserId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Please log in first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Bookings</Text>

      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('verse')}
          style={[styles.tab, activeTab === 'verse' && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'verse' && styles.activeTabText,
            ]}
          >
            Verse
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('tournament')}
          style={[styles.tab, activeTab === 'tournament' && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'tournament' && styles.activeTabText,
            ]}
          >
            Tournament
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : filteredBookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings found.</Text>
        ) : (
          filteredBookings.map((item) => (
            <BookingCard
              key={item.bookingId}
              booking={item}
              onCancel={setCancelTarget}
            />
          ))
        )}
      </ScrollView>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Booking"
        message="Do you want to cancel this booking?"
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#888',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
  },
});