import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity, Alert, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useHistory, HistoryEntry } from '@/context/HistoryContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

function HistoryItem({ 
  item, 
  onDelete,
  onUpdateName,
  onToggleFavorite
}: { 
  item: HistoryEntry,
  onDelete: (id: string) => void,
  onUpdateName: (id: string, newName: string) => void,
  onToggleFavorite: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(item.name || '');

  const colorScheme = useThemeColor({}, 'background') === Colors.light.background ? 'light' : 'dark';
  const cardBgColor = colorScheme === 'light' ? '#fff' : '#333';
  const cardBorderColor = colorScheme === 'light' ? '#eee' : '#444';
  const indicatorColor = colorScheme === 'light' ? '#888' : '#aaa';
  const textColor = useThemeColor({}, 'text');
  const iconColor = colorScheme === 'light' ? '#ff6b6b' : '#ff8787';
  const editIconColor = colorScheme === 'light' ? '#888' : '#aaa';
  const inputBgColor = colorScheme === 'light' ? '#f0f0f0' : '#222';
  const favoriteIconColor = item.is_favorite ? Colors.light.tint : (colorScheme === 'light' ? '#ccc' : '#555');

  const handleUpdateName = () => {
    onUpdateName(item.id, newName);
    setIsEditing(false);
  };

  return (
    <View style={[styles.itemContainer, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
      <View style={styles.itemHeader}>
        {isEditing ? (
          <TextInput
            style={[styles.nameInput, { backgroundColor: inputBgColor, borderColor: cardBorderColor, color: textColor }]}
            value={newName}
            onChangeText={setNewName}
            autoFocus
            onBlur={handleUpdateName}
            onSubmitEditing={handleUpdateName}
          />
        ) : (
          <Text style={[styles.itemName, { color: textColor }]} onPress={() => setIsEditing(true)}>
            {item.name || 'Sin nombre'}
          </Text>
        )}
        <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => onToggleFavorite(item.id)} style={styles.favoriteButton}>
              <Ionicons name={item.is_favorite ? "star" : "star-outline"} size={22} color={favoriteIconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
              <Ionicons name={isEditing ? "checkmark-circle" : "pencil"} size={18} color={editIconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={18} color={iconColor} />
            </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.langIndicator, { color: indicatorColor }]}>
        {`${item.fromLang} → ${item.toLang}`}
      </Text>
      <Text style={[styles.textOriginal, { color: textColor }]}>
        {item.fromText}
      </Text>
      <Text style={[styles.textTranslated, { color: textColor }]}>
        {item.toText}
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { history, isLoading, deleteHistoryEntry, clearAllHistory, updateHistoryName, toggleFavorite } = useHistory();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');
  
  const colorScheme = useThemeColor({}, 'background') === Colors.light.background ? 'light' : 'dark';
  const modalBgColor = colorScheme === 'light' ? 'white' : '#222';
  const buttonColor = colorScheme === 'light' ? '#f0f0f0' : '#333';
  const dangerColor = '#ff6b6b';
  const cancelColor = colorScheme === 'light' ? '#0a84ff' : '#0a84ff';

  const displayedHistory = useMemo(() => {
    if (activeTab === 'favorites') {
      return history.filter(item => item.is_favorite);
    }
    return history;
  }, [history, activeTab]);

  const handleClearAll = async () => {
    await clearAllHistory();
    setShowConfirmModal(false);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centeredView}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Historial</ThemedText>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={() => setShowConfirmModal(true)}>
            <Ionicons name="trash-outline" size={22} color={dangerColor} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>Favoritos</Text>
        </TouchableOpacity>
      </View>

      {displayedHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText>No hay traducciones para mostrar.</ThemedText>
          {activeTab === 'favorites' && <ThemedText>Marca algunas traducciones como favoritas.</ThemedText>}
        </View>
      ) : (
        <FlatList
          data={displayedHistory}
          renderItem={({ item }) => (
            <HistoryItem 
              item={item} 
              onDelete={deleteHistoryEntry} 
              onUpdateName={updateHistoryName}
              onToggleFavorite={toggleFavorite}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: modalBgColor }]}>
            <ThemedText style={styles.modalTitle}>Limpiar Historial</ThemedText>
            <ThemedText style={styles.modalText}>
              ¿Estás seguro de que quieres eliminar todo el historial de traducciones? Esta acción no se puede deshacer.
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.button, { backgroundColor: buttonColor }]} onPress={() => setShowConfirmModal(false)}>
                <Text style={[styles.buttonText, { color: cancelColor }]}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.button, { backgroundColor: buttonColor }]} onPress={handleClearAll}>
                <Text style={[styles.buttonText, { color: dangerColor }]}>Eliminar Todo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
  },
  title: {
    textAlign: 'center',
    flex: 1,
  },
  clearAllButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  itemContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 16,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
  },
  editButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  deleteButton: {
    padding: 4,
  },
  langIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  textOriginal: {
    fontSize: 14,
    marginBottom: 8,
  },
  textTranslated: {
    fontSize: 14,
    fontWeight: '500',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: '45%',
    alignItems: 'center',
  },
  buttonText: {
      fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  activeTab: {
    backgroundColor: Colors.light.tint,
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
});
