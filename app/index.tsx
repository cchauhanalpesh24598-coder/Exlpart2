import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SharedDataContext } from './_layout';
import { COLORS } from '../src/utils/constants';

// Simple ID generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    setMessages,
    setPhotos,
    setHasSharedContent,
  } = useContext(SharedDataContext);

  const handleManualEntry = () => {
    router.push('/table-view');
  };

  const handlePickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newPhotos = result.assets.map((asset, index) => ({
          id: generateId(),
          uri: asset.uri,
          timestamp: Date.now(),
          index,
          messageIndex: 0,
        }));

        setPhotos(newPhotos);
        
        const sampleMessage = {
          id: generateId(),
          text: 'Manual photo selection\napplicant:- Sample Name\n(Sample Bank)',
          timestamp: Date.now(),
          index: 0,
        };
        
        setMessages([sampleMessage]);
        setHasSharedContent(true);
        router.push('/message-view');
      }
    } catch (error) {
      console.log('[v0] Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleDemo = () => {
    const demoMessages = [
      {
        id: generateId(),
        text: 'Property Visit Report\napplicant:- Ramesh Kumar\nLocation verified successfully\n(HDFC Bank)',
        timestamp: Date.now(),
        index: 0,
      },
      {
        id: generateId(),
        text: 'Site Inspection Done\napplicant:- Priya Sharma\nAll documents verified\n(ICICI Bank)',
        timestamp: Date.now(),
        index: 1,
      },
      {
        id: generateId(),
        text: 'CNV Complete\napplicant:- Amit Patel\nProperty matches description\n(Axis Bank)',
        timestamp: Date.now(),
        index: 2,
      },
    ];

    setMessages(demoMessages);
    setPhotos([]);
    setHasSharedContent(true);
    router.push('/message-view');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{'📊'}</Text>
        </View>
        <Text style={styles.title}>OCR Excel App</Text>
        <Text style={styles.subtitle}>
          Extract data from WhatsApp messages and photos automatically
        </Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to use:</Text>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            Select messages and photos in WhatsApp
          </Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>
            Share them to this app (forward/share)
          </Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>
            Data will be auto-extracted and shown in table
          </Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>4</Text>
          <Text style={styles.stepText}>
            Export to Excel and share
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handlePickImages}>
          <Text style={styles.primaryButtonText}>Select Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleManualEntry}>
          <Text style={styles.secondaryButtonText}>Manual Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.demoButton} onPress={handleDemo}>
          <Text style={styles.demoButtonText}>Try Demo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Share content from WhatsApp to auto-open this screen
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  instructions: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
    marginRight: 12,
    overflow: 'hidden',
  },
  stepText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
