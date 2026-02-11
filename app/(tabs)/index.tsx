import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [gastoTotal, setGastoTotal] = useState(0);

  const handleAgregarGasto = () => {
    setGastoTotal((prevTotal) => prevTotal + 5000);
    Alert.alert('Gasto registrado', 'Se sumaron $5.000 al gasto total.');
  };

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
        <Text style={styles.gastoText}>Gasto Total: ${gastoTotal.toLocaleString('es-CL')}</Text>
        <Text style={styles.dynamicText}>Chip dice: Ya llevas ${gastoTotal.toLocaleString('es-CL')} gastados...</Text>

        <Pressable style={styles.addButton} onPress={handleAgregarGasto}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
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
  subtitle: { color: '#888', fontSize: 14, marginTop: 10 },
  gastoText: { color: '#FFF', fontSize: 16, marginTop: 16, fontWeight: '600' },
  dynamicText: { color: '#C0C0C0', fontSize: 14, marginTop: 8, textAlign: 'center' },
  addButton: {
    marginTop: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonText: { color: '#FFF', fontSize: 32, lineHeight: 36, fontWeight: 'bold' }
});
