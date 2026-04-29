import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BookingCard = ({ booking, onCancel }) => {
  const title =
    booking?.tournamentName ||
    booking?.name ||
    booking?.opponentName ||
    'Tournament';

  const dateText =
    booking?.date ||
    booking?.startDate ||
    booking?.eventDate ||
    'No date';

  const timeText =
    booking?.time ||
    booking?.endDate ||
    '';

  const locationText =
    booking?.location ||
    [booking?.city, booking?.state, booking?.country].filter(Boolean).join(', ') ||
    'No location';

  const statusText = booking?.status || 'registered';

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>{title}</Text>
        </View>

        <Text style={styles.details}>
          {dateText}{timeText ? ` • ${timeText}` : ''}
        </Text>

        <Text style={styles.details}>
          {locationText}
        </Text>

        <Text style={styles.status}>
          Status: {statusText}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onCancel(booking)}
        style={styles.cancelBtn}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  info: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    flexShrink: 1,
  },
  details: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  status: {
    color: '#007AFF',
    fontSize: 13,
    marginTop: 6,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 6,
  },
  cancelText: {
    color: '#ff4444',
    fontSize: 12,
  },
});

export default BookingCard;