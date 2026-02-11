import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.levelText}>NIVEL HIERRO</Text>
      <View style={styles.card}>
        <Image 
          source={require('../../assets/images/chip_pobre.png')} 
          style={styles.image} 
        />
        <Text style={styles.title}>Chip está decepcionado...</Text>
        <Text style={styles.subtitle}>¿En serio gastaste en eso?</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  levelText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 20, marginBottom: 20 },
  card: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, alignItems: 'center' },
  image: { width: 250, height: 250, marginBottom: 20 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 14, marginTop: 10 }
});