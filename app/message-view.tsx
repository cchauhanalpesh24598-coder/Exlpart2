import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SharedDataContext } from './_layout';
import { MessageList } from '../src/components/MessageList';
import { COLORS } from '../src/utils/constants';

export default function MessageViewScreen() {
  const router = useRouter();
  const { messages, photos } = useContext(SharedDataContext);

  const handleProcessData = () => {
    // Navigate to table view to start processing
    router.push('/table-view');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Message List */}
      <View style={styles.listContainer}>
        <MessageList messages={messages} photos={photos} />
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {messages.length} Messages | {Math.min(messages.length, photos.length)} Photos to process
          </Text>
          <Text style={styles.summarySubtext}>
            First photo of each message will be used for GPS extraction
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.processButton,
            messages.length === 0 && styles.processButtonDisabled,
          ]}
          onPress={handleProcessData}
          disabled={messages.length === 0}
        >
          <Text style={styles.processButtonText}>
            Process Data
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    flex: 1,
  },
  actionBar: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  summary: {
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  summarySubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  processButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  processButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
