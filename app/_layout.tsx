import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SharedMessage, SharedPhoto, DataRow } from '../src/types';
import { checkShareIntent, subscribeToShareEvents } from '../src/services/intent-handler';

// Global context for shared data
export const SharedDataContext = React.createContext<{
  messages: SharedMessage[];
  photos: SharedPhoto[];
  rows: DataRow[];
  setMessages: (messages: SharedMessage[]) => void;
  setPhotos: (photos: SharedPhoto[]) => void;
  setRows: (rows: DataRow[]) => void;
  hasSharedContent: boolean;
  setHasSharedContent: (value: boolean) => void;
  clearSharedContent: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  processingStatus: string;
  setProcessingStatus: (status: string) => void;
}>({
  messages: [],
  photos: [],
  rows: [],
  setMessages: () => {},
  setPhotos: () => {},
  setRows: () => {},
  hasSharedContent: false,
  setHasSharedContent: () => {},
  clearSharedContent: () => {},
  isProcessing: false,
  setIsProcessing: () => {},
  processingStatus: '',
  setProcessingStatus: () => {},
});

export default function RootLayout() {
  const [messages, setMessages] = useState<SharedMessage[]>([]);
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [hasSharedContent, setHasSharedContent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const router = useRouter();

  // Check for share intent on app launch
  useEffect(() => {
    const initShareIntent = async () => {
      try {
        const result = await checkShareIntent();
        
        if (result.hasSharedContent) {
          setMessages(result.messages);
          setPhotos(result.photos);
          setHasSharedContent(true);
          
          // Navigate to message view automatically
          router.replace('/message-view');
        }
      } catch (error) {
        console.error('Error checking share intent:', error);
      }
    };

    initShareIntent();

    // Subscribe to new share events while app is open
    const unsubscribe = subscribeToShareEvents((data) => {
      if (data.messages.length > 0 || data.photos.length > 0) {
        setMessages(data.messages);
        setPhotos(data.photos);
        setHasSharedContent(true);
        router.replace('/message-view');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const clearSharedContent = () => {
    setMessages([]);
    setPhotos([]);
    setRows([]);
    setHasSharedContent(false);
    setIsProcessing(false);
    setProcessingStatus('');
  };

  return (
    <SharedDataContext.Provider
      value={{
        messages,
        photos,
        rows,
        setMessages,
        setPhotos,
        setRows,
        hasSharedContent,
        setHasSharedContent,
        clearSharedContent,
        isProcessing,
        setIsProcessing,
        processingStatus,
        setProcessingStatus,
      }}
    >
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a73e8',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'OCR Excel App',
            }}
          />
          <Stack.Screen
            name="message-view"
            options={{
              title: 'Shared Messages',
            }}
          />
          <Stack.Screen
            name="table-view"
            options={{
              title: 'Extracted Data',
            }}
          />
          <Stack.Screen
            name="export-view"
            options={{
              title: 'Export to Excel',
            }}
          />
        </Stack>
      </View>
    </SharedDataContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
