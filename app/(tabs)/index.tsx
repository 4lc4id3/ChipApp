import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function HomeScreen() {
  const [gastoTotal, setGastoTotal] = useState(0);
  const [sueldoMensual, setSueldoMensual] = useState('');
  const [presupuestoDiario, setPresupuestoDiario] = useState('');
  const [setupCompleto, setSetupCompleto] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [montoGasto, setMontoGasto] = useState('');
  const [descripcionGasto, setDescripcionGasto] = useState('');
  const [ultimoGasto, setUltimoGasto] = useState<{ monto: number; descripcion: string } | null>(null);

  const parseCurrencyInput = (value: string) => {
    const onlyDigits = value.replace(/\D/g, '');
    return Number(onlyDigits);
  };

  const handleGuardarGasto = () => {
    const monto = parseCurrencyInput(montoGasto);
    const descripcion = descripcionGasto.trim();

    if (!monto || monto <= 0 || !descripcion) {
      Alert.alert('Datos incompletos', 'Ingresa un monto válido y una descripción para guardar el gasto.');
      return;
    }

    setGastoTotal((prevTotal) => prevTotal + monto);
    setUltimoGasto({ monto, descripcion });
    setMontoGasto('');
    setDescripcionGasto('');
    setModalVisible(false);
  };

  const handleEmpezar = () => {
    const sueldo = parseCurrencyInput(sueldoMensual);
    const presupuesto = parseCurrencyInput(presupuestoDiario);

    if (!sueldo || !presupuesto || sueldo <= 0 || presupuesto <= 0) {
      Alert.alert('Datos incompletos', 'Ingresa un sueldo y presupuesto diario válidos.');
      return;
    }

    setSueldoMensual(String(sueldo));
    setPresupuestoDiario(String(presupuesto));
    setSetupCompleto(true);
  };

  const presupuestoDiarioNumero = parseCurrencyInput(presupuestoDiario) || 0;
  const porcentajeGastadoReal = presupuestoDiarioNumero > 0 ? (gastoTotal / presupuestoDiarioNumero) * 100 : 0;
  const porcentajeGastadoBarra = Math.min(porcentajeGastadoReal, 100);

  if (!setupCompleto) {
    return (
      <View style={styles.container}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Configura tu objetivo diario</Text>
          <Text style={styles.formLabel}>¿Cuál es tu sueldo mensual?</Text>
          <TextInput
            value={sueldoMensual}
            onChangeText={setSueldoMensual}
            keyboardType="numeric"
            placeholder="Ej: 850000"
            placeholderTextColor="#6E6E6E"
            style={styles.input}
          />

          <Text style={styles.formLabel}>¿Cuánto quieres gastar como máximo al día?</Text>
          <TextInput
            value={presupuestoDiario}
            onChangeText={setPresupuestoDiario}
            keyboardType="numeric"
            placeholder="Ej: 20000"
            placeholderTextColor="#6E6E6E"
            style={styles.input}
          />

          <Pressable style={styles.startButton} onPress={handleEmpezar}>
            <Text style={styles.startButtonText}>Empezar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
        {ultimoGasto ? (
          <Text style={styles.ultimoGastoText}>
            Último gasto: ${ultimoGasto.monto.toLocaleString('es-CL')} en {ultimoGasto.descripcion}
          </Text>
        ) : null}

        <View style={styles.progressWrapper}>
          <Text style={styles.progressLabel}>Presupuesto diario usado: {porcentajeGastadoReal.toFixed(0)}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${porcentajeGastadoBarra}%` }]} />
          </View>
        </View>

        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>

        <Modal
          transparent
          animationType="fade"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Registrar gasto</Text>

              <Text style={styles.formLabel}>Monto del gasto</Text>
              <TextInput
                value={montoGasto}
                onChangeText={setMontoGasto}
                keyboardType="numeric"
                placeholder="Ej: 3000"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
              />

              <Text style={styles.formLabel}>Descripción</Text>
              <TextInput
                value={descripcionGasto}
                onChangeText={setDescripcionGasto}
                placeholder="Ej: Completos"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
              />

              <View style={styles.modalButtonsRow}>
                <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.modalButton, styles.saveButton]} onPress={handleGuardarGasto}>
                  <Text style={styles.modalButtonText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 24 },
  formCard: {
    width: '100%',
    backgroundColor: '#1B1B1B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2F2F2F'
  },
  formTitle: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 20 },
  formLabel: { color: '#D2D2D2', fontSize: 15, marginBottom: 8 },
  input: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 16
  },
  startButton: {
    marginTop: 8,
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  startButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  levelText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 20, marginBottom: 20 },
  card: { width: '100%', backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, alignItems: 'center' },
  image: { width: 250, height: 250, marginBottom: 20 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 14, marginTop: 10 },
  gastoText: { color: '#FFF', fontSize: 16, marginTop: 16, fontWeight: '600' },
  dynamicText: { color: '#C0C0C0', fontSize: 14, marginTop: 8, textAlign: 'center' },
  ultimoGastoText: { color: '#FFCB7D', fontSize: 14, marginTop: 8, textAlign: 'center' },
  progressWrapper: { width: '100%', marginTop: 18 },
  progressLabel: { color: '#D4D4D4', fontSize: 13, marginBottom: 8 },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: '#2B2B2B',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 999
  },
  addButton: {
    marginTop: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonText: { color: '#FFF', fontSize: 32, lineHeight: 36, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1B1B1B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2F2F2F'
  },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#363636'
  },
  saveButton: {
    backgroundColor: '#FF8C00'
  },
  modalButtonText: { color: '#FFF', fontWeight: '700' }
});
