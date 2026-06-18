import React, { useState, useRef, useMemo } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { useColors, useStrings } from '../src/context/PreferencesContext';
import { FF } from '../src/constants/Typography';

let NativeAudio: any = null;
let NativeFileSystem: any = null;
if (Platform.OS !== 'web') {
  try { NativeAudio = require('expo-av').Audio; } catch {}
  try { NativeFileSystem = require('expo-file-system/legacy'); } catch {}
}

interface Props {
  onSubmit: (text: string) => void;
  onAudioSubmit: (base64: string, mimeType: string) => void;
  isLoading: boolean;
}

export default function VoiceInputBar({ onSubmit, onAudioSubmit, isLoading }: Props) {
  const colors = useColors();
  const s = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const recordingRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await (navigator.mediaDevices as any).getUserMedia({ audio: true });
        const recorder = new (window as any).MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e: any) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            onAudioSubmit(base64, 'audio/webm');
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach((t: any) => t.stop());
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
      } else {
        const { granted } = await NativeAudio.requestPermissionsAsync();
        if (!granted) return;
        await NativeAudio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await NativeAudio.Recording.createAsync(
          NativeAudio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
      }
      setIsRecording(true);
    } catch (e) {
      console.warn('녹음 시작 실패:', e);
    }
  };

  const stopRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        mediaRecorderRef.current?.stop();
      } else {
        const recording = recordingRef.current;
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI()!;
        const base64 = await NativeFileSystem.readAsStringAsync(uri, {
          encoding: NativeFileSystem.EncodingType.Base64,
        });
        onAudioSubmit(base64, 'audio/mp4');
        recordingRef.current = null;
      }
    } catch (e) {
      console.warn('녹음 중지 실패:', e);
    } finally {
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isLoading) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSubmit(text.trim());
    setText('');
  };

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <View style={styles.recordingBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.recordingText}>{s.recording}</Text>
        </View>
      )}
      {isLoading && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>{s.analyzing}</Text>
        </View>
      )}
      <View style={styles.bar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={s.inputPlaceholder}
          placeholderTextColor={colors.textFaint}
          editable={!isLoading && !isRecording}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          onPress={toggleRecording}
          disabled={isLoading}
          style={[styles.micBtn, isRecording && styles.micBtnActive]}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎙'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading || !text.trim()}
          style={[styles.sendBtn, (!text.trim() || isLoading) && styles.sendBtnDisabled]}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrapper: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
    bar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    input: {
      flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 12, color: colors.text, fontFamily: FF,
    },
    micBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
    },
    micBtnActive: { backgroundColor: colors.errorBg },
    micIcon: { fontSize: 16 },
    sendBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: colors.surfaceLight },
    sendIcon: { fontSize: 18, color: colors.bg, fontWeight: '700', fontFamily: FF },
    recordingBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      alignSelf: 'center', marginBottom: 8,
      backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder,
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
    recordingText: { fontSize: 10, color: colors.error, fontWeight: '700', fontFamily: FF },
    loadingBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      alignSelf: 'center', marginBottom: 8,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    },
    loadingText: { fontSize: 10, color: colors.accent, fontWeight: '700', fontFamily: FF },
  });
}
