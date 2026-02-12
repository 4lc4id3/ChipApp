import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
  const presupuestoRestante = Math.max(presupuestoDiarioNumero - gastoTotal, 0);
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
      <View style={styles.headerRow}>
        <Text style={styles.levelText}>{xpTotal < 300 ? nivelActual.nombre : `Nivel ${nivelActualNumero}`}</Text>
        <Pressable onPress={() => setNivelModalVisible(true)} style={styles.medalButton}>
          <Text style={styles.medalEmoji}>🏅</Text>
        </Pressable>
      </View>

      <View style={styles.xpBarWrapper}>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${porcentajeXpNivel}%` }]} />
        </View>
        <Text style={styles.xpLabel}>XP: {xpTotal}</Text>
        {xpFeedback ? <Text style={styles.xpFeedback}>{xpFeedback}</Text> : null}
      </View>

      <LinearGradient colors={['#364350', '#222732', '#1B1A1D', '#8A4A08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <Text style={styles.heroTitle}>Presupuesto Restante:</Text>
        <Text style={styles.heroAmount}>${presupuestoRestante.toLocaleString('es-CL')}</Text>
        <Text style={styles.gastoText}>Gasto Total: ${gastoTotal.toLocaleString('es-CL')}</Text>

        <View style={styles.chipRow}>
          <Image source={require('../../assets/images/chip_pobre.png')} style={styles.image} resizeMode="cover" />
          <View style={styles.bubbleContainer}>
            <View style={styles.bubbleTail} />
            <View style={styles.speechBubble}>
              <Text style={styles.dynamicText}>{chipFrase}</Text>
            </View>
          </View>
        </View>

        {ultimoGasto ? (
          <Text style={styles.ultimoGastoText}>
            Último gasto: ${ultimoGasto.monto.toLocaleString('es-CL')} en {ultimoGasto.descripcion} ({ultimoGasto.categoria}) · XP{' '}
            {ultimoGasto.xpDelta > 0 ? '+' : ''}
            {ultimoGasto.xpDelta}
            {ultimoGasto.categoria === 'gusto' ? ' (incluye Bono de Honestidad +10 XP)' : ''}
          </Text>
        ) : null}
      </LinearGradient>

      <LinearGradient colors={['#222830', '#131722']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.progressCard}>
        <Text style={styles.progressTitle}>Progreso Diario</Text>
        <View style={styles.progressWrapper}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#FFA247', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${porcentajeGastadoBarra}%` }]}
            >
              <Text style={styles.progressPercent}>{porcentajeGastadoReal.toFixed(0)}%</Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050507', paddingHorizontal: 22, paddingTop: 58 },
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medalButton: { padding: 4 },
  medalEmoji: { fontSize: 30 },
  levelText: { color: '#F5F5F5', fontWeight: '800', fontSize: 46 / 2, marginBottom: 10 },
  xpBarWrapper: { width: '100%', marginBottom: 24 },
  xpLabel: { color: '#B6BBC7', fontSize: 12, marginTop: 6 },
  xpTrack: {
    width: '100%',
    height: 16 / 2,
    borderRadius: 999,
    backgroundColor: '#2F3138',
    overflow: 'hidden'
  },
  xpFill: { height: '100%', backgroundColor: '#FF921E', borderRadius: 999 },
  xpFeedback: {
    marginTop: 6,
    color: '#FFCB7D',
    fontSize: 13,
    fontWeight: '700'
  },
  heroCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 34,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 18
  },
  heroTitle: { color: '#F2F2F2', fontSize: 21, fontWeight: '700', textAlign: 'center' },
  heroAmount: { color: '#FFFFFF', fontSize: 74, fontWeight: '800', textAlign: 'center', marginTop: 8, marginBottom: 10 },
  gastoText: { color: '#E6E6E6', fontSize: 21, textAlign: 'center' },
  chipRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 28, gap: 14 },
  image: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: '#F28D1E'
  },
  bubbleContainer: { flex: 1, position: 'relative', justifyContent: 'center' },
  speechBubble: {
    backgroundColor: 'rgba(244, 136, 47, 0.35)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    minHeight: 118,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  bubbleTail: {
    position: 'absolute',
    left: -18,
    top: 55,
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderRightWidth: 20,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(244, 136, 47, 0.35)'
  },
  dynamicText: { color: '#FFFFFF', fontSize: 17, lineHeight: 25 },
  ultimoGastoText: { color: '#FFCB7D', fontSize: 12, marginTop: 14, textAlign: 'center' },
  progressCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 24
  },
  progressTitle: { color: '#F4F4F4', fontSize: 44 / 2, marginBottom: 18 },
  progressWrapper: { width: '100%' },
  progressTrack: {
    width: '100%',
    height: 60 / 2,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D6771B',
    backgroundColor: '#2A2D34',
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 4
  },
  progressFill: {
    height: '100%',
    borderRadius: 14,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressPercent: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  addButton: {
    position: 'absolute',
    right: 26,
    bottom: 46,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FF970F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF970F',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12
  },
  addButtonText: { color: '#FFF', fontSize: 48, lineHeight: 48, fontWeight: '300' },
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
