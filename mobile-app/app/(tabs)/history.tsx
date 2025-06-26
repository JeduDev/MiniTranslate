import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator, useColorScheme } from 'react-native';
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

  const handleDelete = async () => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que quieres eliminar esta entrada del historial?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete(item.id);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo eliminar la entrada.');
            }
          },
        },
      ]
    );
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
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
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
  const { history, isLoading, deleteHistoryEntry, updateHistoryName, toggleFavorite } = useHistory();
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');
  
  const colorScheme = useColorScheme();
  const activeTabColor = Colors.light.tint;
  const inactiveTabColor = colorScheme === 'dark' ? '#333' : '#eee';
  const activeTextColor = 'white';
  const inactiveTextColor = colorScheme === 'dark' ? '#ccc' : '#555';

  const displayedHistory = useMemo(() => {
    if (activeTab === 'favorites') {
      return history.filter(item => item.is_favorite);
    }
    return history;
  }, [history, activeTab]);

  if (isLoading) {
    return (
      <ThemedView style={styles.centeredView}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, { backgroundColor: activeTab === 'history' ? activeTabColor : inactiveTabColor }]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons name="time-outline" size={20} color={activeTab === 'history' ? activeTextColor : inactiveTextColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, { backgroundColor: activeTab === 'favorites' ? activeTabColor : inactiveTabColor }]}
          onPress={() => setActiveTab('favorites')}
        >
          <Ionicons name="star-outline" size={20} color={activeTab === 'favorites' ? activeTextColor : inactiveTextColor} />
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 25,
  },
  listContentContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  itemContainer: {
    padding: 10,
    marginBottom: 8,
    borderRadius: 15,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 15,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  langIndicator: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  textOriginal: {
    fontSize: 14,
    marginBottom: 6,
  },
  textTranslated: {
    fontSize: 14,
    fontWeight: '600',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 20,
  },
  tab: {
    padding: 12,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
