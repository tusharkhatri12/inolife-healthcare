import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const SalesScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card} onPress={() => navigation.navigate('AddSales')}>
        <Card.Content>
          <Ionicons name="cart" size={32} color="#2196F3" style={styles.icon} />
          <Text variant="titleMedium" style={styles.cardTitle}>
            Add Sales Entry
          </Text>
          <Text variant="bodySmall" style={styles.cardDesc}>
            Record sales at stockist (with optional doctor link)
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => navigation.navigate('AddScheme')}>
        <Card.Content>
          <Ionicons name="pricetag" size={32} color="#2196F3" style={styles.icon} />
          <Text variant="titleMedium" style={styles.cardTitle}>
            Add Scheme
          </Text>
          <Text variant="bodySmall" style={styles.cardDesc}>
            Log scheme offered to stockist (Discount / Free Qty / Credit)
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => navigation.navigate('SalesHistory')}>
        <Card.Content>
          <Ionicons name="list" size={32} color="#2196F3" style={styles.icon} />
          <Text variant="titleMedium" style={styles.cardTitle}>
            My Sales
          </Text>
          <Text variant="bodySmall" style={styles.cardDesc}>
            View past sales and product-wise details (read-only)
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  card: { marginBottom: 16 },
  icon: { marginBottom: 8 },
  cardTitle: { marginBottom: 4 },
  cardDesc: { color: '#666' },
});

export default SalesScreen;
