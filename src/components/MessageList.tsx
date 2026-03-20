import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SharedMessage, SharedPhoto } from '../types';
import { COLORS } from '../utils/constants';

interface MessageListProps {
  messages: SharedMessage[];
  photos: SharedPhoto[];
}

interface MessageItemProps {
  message: SharedMessage;
  photo?: SharedPhoto;
  index: number;
}

const { width } = Dimensions.get('window');

const MessageItem: React.FC<MessageItemProps> = ({ message, photo, index }) => {
  return (
    <View style={styles.messageContainer}>
      {/* Message Header */}
      <View style={styles.messageHeader}>
        <Text style={styles.messageNumber}>Message {index + 1}</Text>
        <Text style={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </View>

      {/* Message Text */}
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{message.text}</Text>
      </View>

      {/* Associated Photo (First Photo Only) */}
      {photo && (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoLabel}>Photo {index + 1} (GPS Source)</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, photos }) => {
  const renderItem = ({ item, index }: { item: SharedMessage; index: number }) => {
    // Get the corresponding first photo for this message
    const correspondingPhoto = photos[index];
    
    return (
      <MessageItem
        message={item}
        photo={correspondingPhoto}
        index={index}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Shared Content</Text>
      <Text style={styles.headerSubtitle}>
        {messages.length} messages, {photos.length} photos
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No messages received</Text>
      <Text style={styles.emptySubtext}>
        Share messages and photos from WhatsApp to get started
      </Text>
    </View>
  );

  return (
    <FlatList
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  messageContainer: {
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.primaryLight,
  },
  messageNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  messageBubble: {
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  photoLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default MessageList;
