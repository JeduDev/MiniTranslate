import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useHistory } from '@/context/HistoryContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useRateLimit } from '@/context/RateLimitContext';
import { API_URL } from '@/constants/api';

// Available languages
const LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Spanish', name: 'Español' },
  { code: 'French', name: 'Français' },
  { code: 'German', name: 'Deutsch' },
  { code: 'Italian', name: 'Italiano' },
  { code: 'Portuguese', name: 'Português' },
  { code: 'Chinese', name: '中文' },
  { code: 'Japanese', name: '日本語' },
  { code: 'Korean', name: '한국어' },
  { code: 'Russian', name: 'Русский' },
];

export default function TranslateScreen() {
  const [textToTranslate, setTextToTranslate] = useState('');
  const [translationName, setTranslationName] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toLang, setToLang] = useState('Spanish');
  const { addHistoryEntry } = useHistory();
  const { token, isAdmin } = useAuth();
  const { canTranslate, registerTranslation, translationsRemaining, timeUntilReset } = useRateLimit();
  
  // Get theme colors
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useThemeColor({}, 'background') === Colors.light.background ? 'light' : 'dark';
  const borderColor = colorScheme === 'light' ? '#ccc' : '#333';
  const inputBgColor = colorScheme === 'light' ? '#fff' : '#222';
  const resultBgColor = colorScheme === 'light' ? '#f0f0f0' : '#333';
  const placeholderColor = colorScheme === 'light' ? '#999' : '#777';
  const warningColor = '#ff9800';

  const formatTimeRemaining = (ms: number | null) => {
    if (ms === null) return '';
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const handleTranslate = async () => {
    if (!canTranslate && !isAdmin) {
      Alert.alert(
        'Límite de traducciones alcanzado',
        `Has alcanzado el límite de traducciones. Por favor espera ${formatTimeRemaining(timeUntilReset)} para continuar.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    setError('');
    // No limpiar el texto traducido aquí para que no desaparezca si se quiere guardar
    // setTranslatedText('');

    try {
      const from = 'English'; // Fixed source language
      
      const response = await fetch(`${API_URL}/api/translate/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: textToTranslate,
          fromLang: from,
          toLang: toLang,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setTranslatedText(data.translatedText);
      
      // Guardar en el historial automáticamente
      await addHistoryEntry({
        name: translationName,
        fromText: textToTranslate,
        toText: data.translatedText,
        fromLang: from,
        toLang: toLang,
      });

      // Limpiar campos después de guardar
      setTranslationName('');

      // Registrar la traducción para el límite de peticiones
      registerTranslation();
    } catch (e) {
      setError('Failed to translate. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContentContainer}
    >
      <ThemedView style={styles.container}>
        {!isAdmin && (
          <View style={styles.rateLimitContainer}>
            <ThemedText style={[
              styles.rateLimitText, 
              { color: translationsRemaining < 3 ? warningColor : textColor }
            ]}>
              {canTranslate 
                ? `Límite: ${translationsRemaining}` 
                : `Recarga en: ${formatTimeRemaining(timeUntilReset)}`
              }
            </ThemedText>
          </View>
        )}
        
        <ThemedText type="title" style={styles.title}>MiniTranslate</ThemedText>
        
        <View style={styles.languageSelector}>
          <ThemedText style={styles.labelText}>Translate to:</ThemedText>
          <View style={[styles.pickerContainer, { borderColor }]}>
            <Picker
              selectedValue={toLang}
              onValueChange={(value) => setToLang(value)}
              style={[styles.picker, { color: textColor }]}
              dropdownIconColor={textColor}
            >
              {LANGUAGES.map((lang) => (
                <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
              ))}
            </Picker>
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
            placeholder="Enter text to translate"
            placeholderTextColor={placeholderColor}
            onChangeText={setTextToTranslate}
            value={textToTranslate}
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, styles.nameInput, { backgroundColor: inputBgColor, borderColor, color: textColor }]}
            placeholder="Nombre para esta traducción (opcional)"
            placeholderTextColor={placeholderColor}
            onChangeText={setTranslationName}
            value={translationName}
          />
        </View>
        
        <Button 
          title="Traducir y Guardar" 
          onPress={handleTranslate} 
          disabled={isLoading || !textToTranslate || (!canTranslate && !isAdmin)} 
        />
        
        {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.activityIndicator} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        {translatedText && (
          <ThemedView style={[styles.resultContainer, { backgroundColor: resultBgColor }]}>
            <ThemedText type="subtitle">Translation:</ThemedText>
            <ThemedText style={styles.translatedText}>{translatedText}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  rateLimitContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rateLimitText: {
    fontSize: 12,
    fontWeight: '500',
  },
  languageSelector: {
    marginBottom: 16,
  },
  labelText: {
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  nameInput: {
    minHeight: 50,
    height: 50,
    textAlignVertical: 'center',
  },
  activityIndicator: {
    marginTop: 16,
  },
  resultContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
  },
  translatedText: {
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  }
});
