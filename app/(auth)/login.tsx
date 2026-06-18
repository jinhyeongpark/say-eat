import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { useColors, useStrings } from '../../src/context/PreferencesContext';
import { FF } from '../../src/constants/Typography';

export default function LoginScreen() {
  const colors = useColors();
  const s = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError(s.loginNoInput);
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      setError(s.loginError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.dot} />
          <Text style={styles.title}>say eat</Text>
          <Text style={styles.subtitle}>{s.loginSubtitle}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={s.emailPlaceholder}
            placeholderTextColor={colors.textFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder={s.passwordPlaceholder}
            placeholderTextColor={colors.textFaint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={styles.submitText}>{isRegister ? s.registerBtn : s.loginBtn}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsRegister(v => !v); setError(''); }}>
            <Text style={styles.toggleText}>
              {isRegister ? s.switchToLogin : s.switchToRegister}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    container: { flexGrow: 1, justifyContent: 'center', padding: 32 },
    header: { alignItems: 'center', marginBottom: 48 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, marginBottom: 12 },
    title: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: 4, fontFamily: FF },
    subtitle: { fontSize: 12, color: colors.textDim, marginTop: 4, fontFamily: FF },
    form: { gap: 12 },
    input: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 14, color: colors.text, fontFamily: FF,
    },
    error: { fontSize: 12, color: colors.error, textAlign: 'center', fontFamily: FF },
    submitBtn: {
      backgroundColor: colors.accent, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center', marginTop: 4,
    },
    submitText: { fontSize: 15, fontWeight: '700', color: colors.bg, fontFamily: FF },
    toggleText: { fontSize: 12, color: colors.textDim, textAlign: 'center', marginTop: 8, fontFamily: FF },
  });
}
