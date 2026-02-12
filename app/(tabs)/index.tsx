import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type ExpenseCategory = 'necesario' | 'gusto' | 'inversion';

type Nivel = {
  nombre: string;
  min: number;
  max: number;
};

const NIVELES: Nivel[] = [
  { nombre: 'Nivel Hierro', min: 0, max: 99 },
  { nombre: 'Nivel Bronce', min: 100, max: 199 },
  { nombre: 'Nivel Plata', min: 200, max: 299 }
];

const XP_POR_NIVEL = 100;

const XP_POR_CATEGORIA: Record<ExpenseCategory, number> = {
  necesario: 20,
  gusto: -30,
  inversion: 10
};

const FRASES_CHIP: Record<ExpenseCategory, string> = {
  necesario: '¡Seco! Fue un gasto necesario, tomaste una decisión inteligente.',
  gusto: 'Fue un gusto... gracias por ser honesto. ¡Chip igual te está mirando de cerca!',
  inversion: '¡Buena jugada! Pensar a futuro también suma.'
};

const BOTONES_CATEGORIA: { key: ExpenseCategory; label: string }[] = [
  { key: 'necesario', label: 'Era Necesario ✅' },
  { key: 'gusto', label: 'Gusto/Deseo 🍭' },
  { key: 'inversion', label: 'Inversión/Otro 📈' }
];

const STORAGE_KEYS = {
  sueldoMensual: 'sueldo',
  presupuestoDiario: 'presupuestoDiario',
  gastoTotal: 'gastoTotal',
  xpTotal: 'xp'
} as const;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export default function HomeScreen() {
  const [gastoTotal, setGastoTotal] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [sueldoMensual, setSueldoMensual] = useState('');
  const [presupuestoDiario, setPresupuestoDiario] = useState('');
  const [setupCompleto, setSetupCompleto] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nivelModalVisible, setNivelModalVisible] = useState(false);
  const [montoGasto, setMontoGasto] = useState('');
  const [descripcionGasto, setDescripcionGasto] = useState('');
  const [chipFrase, setChipFrase] = useState('Registra tu primer gasto para ver cómo te va hoy.');
  const [xpFeedback, setXpFeedback] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [ultimoGasto, setUltimoGasto] = useState<{
    monto: number;
    descripcion: string;
    categoria: ExpenseCategory;
    xpDelta: number;
  } | null>(null);

  const parseCurrencyInput = (value: string) => {
    const onlyDigits = value.replace(/\D/g, '');
    return Number(onlyDigits);
  };

  const nivelActualNumero = Math.floor(xpTotal / XP_POR_NIVEL) + 1;

  const nivelActual = useMemo(() => {
    return NIVELES.find((nivel) => xpTotal >= nivel.min && xpTotal <= nivel.max) ?? { nombre: `Nivel ${nivelActualNumero}`, min: 0, max: 0 };
  }, [xpTotal, nivelActualNumero]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
        const values = Object.fromEntries(entries);

        const sueldoGuardado = values[STORAGE_KEYS.sueldoMensual];
        const presupuestoGuardado = values[STORAGE_KEYS.presupuestoDiario];
        const gastoGuardado = values[STORAGE_KEYS.gastoTotal];
        const xpGuardada = values[STORAGE_KEYS.xpTotal];

        const sueldoParseado = sueldoGuardado ? JSON.parse(sueldoGuardado) : 0;
        const presupuestoParseado = presupuestoGuardado ? JSON.parse(presupuestoGuardado) : 0;
        const gastoParseado = gastoGuardado ? JSON.parse(gastoGuardado) : 0;
        const xpParseada = xpGuardada ? JSON.parse(xpGuardada) : 0;

        if (Number(sueldoParseado) > 0) {
          setSueldoMensual(String(sueldoParseado));
          setSetupCompleto(true);
        }

        if (Number(presupuestoParseado) > 0) {
          setPresupuestoDiario(String(presupuestoParseado));
        }

        setGastoTotal(Number(gastoParseado) || 0);
        setXpTotal(Number(xpParseada) || 0);
      } catch (error) {
        console.error('Error al cargar datos locales', error);
      } finally {
        setIsReady(true);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const persistirDatos = async () => {
      try {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.sueldoMensual, JSON.stringify(parseCurrencyInput(sueldoMensual) || 0)],
          [STORAGE_KEYS.presupuestoDiario, JSON.stringify(parseCurrencyInput(presupuestoDiario) || 0)],
          [STORAGE_KEYS.gastoTotal, JSON.stringify(gastoTotal)],
          [STORAGE_KEYS.xpTotal, JSON.stringify(xpTotal)]
        ]);
      } catch (error) {
        console.error('Error al persistir datos locales', error);
      }
    };

    persistirDatos();
  }, [gastoTotal, isReady, presupuestoDiario, sueldoMensual, xpTotal]);

  useEffect(() => {
    if (!xpFeedback) {
      return;
    }

    const timer = setTimeout(() => {
      setXpFeedback('');
    }, 1200);

    return () => clearTimeout(timer);
  }, [xpFeedback]);

  const xpEnNivel = ((xpTotal % XP_POR_NIVEL) + XP_POR_NIVEL) % XP_POR_NIVEL;
  const porcentajeXpNivel = clamp((xpEnNivel / XP_POR_NIVEL) * 100, 0, 100);
  const xpFaltanteSiguienteNivel = XP_POR_NIVEL - xpEnNivel;

  const handleGuardarGasto = (categoria: ExpenseCategory) => {
    const monto = parseCurrencyInput(montoGasto);
    const descripcion = descripcionGasto.trim();

    if (!monto || monto <= 0 || !descripcion) {
      Alert.alert('Datos incompletos', 'Ingresa un monto válido y una descripción para guardar el gasto.');
      return;
    }

    const xpDeltaBase = XP_POR_CATEGORIA[categoria];
    const bonoHonestidad = categoria === 'gusto' ? 10 : 0;
    const xpDeltaFinal = xpDeltaBase + bonoHonestidad;
    const nuevoGastoTotal = gastoTotal + monto;
    const xpTrasResta = clamp(xpTotal + xpDeltaBase, 0, Number.MAX_SAFE_INTEGER);
    const nuevoXpTotal = clamp(xpTrasResta + bonoHonestidad, 0, Number.MAX_SAFE_INTEGER);

    setGastoTotal(nuevoGastoTotal);
    setXpTotal(nuevoXpTotal);
    setUltimoGasto({ monto, descripcion, categoria, xpDelta: xpDeltaFinal });
    setXpFeedback(`${xpDeltaFinal >= 0 ? '+' : ''}${xpDeltaFinal} XP`);
    setChipFrase(FRASES_CHIP[categoria]);

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

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chip está recordando tus gastos...</Text>
      </View>
    );
  }

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
      <Text style={styles.levelText}>{xpTotal < 300 ? nivelActual.nombre : `Nivel ${nivelActualNumero}`}</Text>
      <View style={styles.xpBarWrapper}>
        <Text style={styles.xpLabel}>XP: {xpTotal}</Text>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${porcentajeXpNivel}%` }]} />
        </View>
        {xpFeedback ? <Text style={styles.xpFeedback}>{xpFeedback}</Text> : null}
      </View>

      <Pressable style={styles.progressButton} onPress={() => setNivelModalVisible(true)}>
        <Text style={styles.progressButtonText}>Ver Progreso</Text>
      </Pressable>

      <View style={styles.card}>
        <Image
          source={require('../../assets/images/chip_pobre.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Chip está atento a tus decisiones</Text>
        <Text style={styles.subtitle}>Cada gasto cambia tu progreso</Text>
        <Text style={styles.gastoText}>Gasto Total: ${gastoTotal.toLocaleString('es-CL')}</Text>
        <Text style={styles.dynamicText}>Chip dice: {chipFrase}</Text>
        {ultimoGasto ? (
          <Text style={styles.ultimoGastoText}>
            Último gasto: ${ultimoGasto.monto.toLocaleString('es-CL')} en {ultimoGasto.descripcion} ({ultimoGasto.categoria}) · XP{' '}
            {ultimoGasto.xpDelta > 0 ? '+' : ''}
            {ultimoGasto.xpDelta}
            {ultimoGasto.categoria === 'gusto' ? ' (incluye Bono de Honestidad +10 XP)' : ''}
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

              <Text style={styles.formLabel}>Clasifica este gasto</Text>
              <View style={styles.categoryButtonsWrapper}>
                {BOTONES_CATEGORIA.map((categoria) => (
                  <Pressable
                    key={categoria.key}
                    style={[styles.categoryButton, styles.saveButton]}
                    onPress={() => handleGuardarGasto(categoria.key)}>
                    <Text style={styles.modalButtonText}>{categoria.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          transparent
          animationType="fade"
          visible={nivelModalVisible}
          onRequestClose={() => setNivelModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Progreso de niveles</Text>

              {NIVELES.map((nivel) => (
                <View key={nivel.nombre} style={styles.levelRow}>
                  <Text style={styles.levelRowTitle}>{nivel.nombre}</Text>
                  <Text style={styles.levelRowRange}>
                    {nivel.min} - {nivel.max} XP
                  </Text>
                </View>
              ))}

              <Text style={styles.nextLevelText}>
                Te faltan {xpFaltanteSiguienteNivel} XP para subir al siguiente nivel.
              </Text>

              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setNivelModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </Pressable>
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
  loadingText: { color: '#FFF', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  levelText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 22, marginBottom: 8 },
  xpBarWrapper: { width: '100%', marginBottom: 12 },
  xpLabel: { color: '#FFF', fontSize: 13, marginBottom: 6, textAlign: 'center' },
  xpTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2B2B2B',
    overflow: 'hidden'
  },
  xpFill: { height: '100%', backgroundColor: '#FFB347', borderRadius: 999 },
  xpFeedback: {
    marginTop: 8,
    color: '#FFCB7D',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700'
  },
  progressButton: {
    backgroundColor: '#2E2E2E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14
  },
  progressButtonText: { color: '#FFF', fontWeight: '600' },
  card: { width: '100%', backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, alignItems: 'center' },
  image: { width: 220, height: 220, marginBottom: 20, alignSelf: 'center' },
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
  categoryButtonsWrapper: {
    gap: 10,
    marginBottom: 12
  },
  categoryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  modalButton: {
    width: '100%',
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
  modalButtonText: { color: '#FFF', fontWeight: '700' },
  levelRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C'
  },
  levelRowTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  levelRowRange: { color: '#BDBDBD', marginTop: 4 },
  nextLevelText: { color: '#FFCB7D', marginVertical: 14, textAlign: 'center' }
});
