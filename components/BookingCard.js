import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BookingCard = ({ booking, onCancel }) => {
  const isTournament = booking?.type === 'tournament';

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>
            {isTournament
              ? booking?.tournamentName || 'Tournament'
              : booking?.opponentName || 'Verse Match'}
          </Text>

          {isTournament && (
            <Text style={styles.badge}>
              {booking?.opponentDup || 'DUPR'}
            </Text>
          )}
        </View>

        <Text style={styles.details}>
          {booking?.date || 'No date'} • {booking?.time || 'No time'}
        </Text>

        <Text style={styles.details}>
          {booking?.location || 'No location'}
        </Text>

        <Text style={styles.status}>
          Status: {booking?.status || 'active'}
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
  badge: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    fontSize: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
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