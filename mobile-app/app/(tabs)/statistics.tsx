import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '@/context/AuthContext';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { API_URL } from '@/constants/api';

interface UsersByDate {
  date: string;
  count: number;
}

interface RoleComparison {
  role_type: string;
  count: number;
}

interface AdminRequestsByDate {
  date: string;
  count: number;
}

interface TranslationsByUser {
  user_name: string;
  user_email: string;
  translation_count: number;
}

interface StatisticsData {
  usersByDate: UsersByDate[];
  roleComparison: RoleComparison[];
  adminRequestsByDate: AdminRequestsByDate[];
  translationsByUser: TranslationsByUser[];
}

const screenWidth = Dimensions.get('window').width;

export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/statistics/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'No se pudieron cargar las estadísticas.');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      Alert.alert('Error', 'Ocurrió un error de red.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatistics();
    }, [])
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffa726" />
          <ThemedText style={styles.loadingText}>Cargando estadísticas...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!statistics) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText>No se pudieron cargar las estadísticas.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const adminUsers = statistics.roleComparison.find(role => role.role_type === 'admin')?.count || 0;
  const regularUsers = statistics.roleComparison.find(role => role.role_type === 'user')?.count || 0;
  const totalUsers = adminUsers + regularUsers;

  const chartConfig = {
    backgroundColor: '#1a1a1a',
    backgroundGradientFrom: '#2a2a2a',
    backgroundGradientTo: '#1a1a1a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>Estadísticas del Sistema</ThemedText>
        
        {/* Resumen General */}
        <View style={styles.summaryContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Resumen General</ThemedText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryNumber}>{totalUsers}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Total Usuarios</ThemedText>
            </View>
            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryNumber}>{adminUsers}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Administradores</ThemedText>
            </View>
          </View>
        </View>

        {/* Usuarios por Fecha */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>👥 Usuarios Registrados (Últimos 30 días)</ThemedText>
          {statistics.usersByDate.length > 0 ? (
            <View>
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: statistics.usersByDate.slice(0, 7).map(item => {
                      const date = new Date(item.date);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }).reverse(),
                    datasets: [{
                      data: statistics.usersByDate.slice(0, 7).map(item => item.count).reverse(),
                      color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})`,
                      strokeWidth: 3,
                    }],
                  }}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </View>
              <View style={styles.listContainer}>
                {statistics.usersByDate.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <ThemedText style={styles.listDate}>{item.date}</ThemedText>
                    <View style={styles.countBadge}>
                      <ThemedText style={styles.countText}>{item.count}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No hay datos disponibles</ThemedText>
          )}
        </View>

        {/* Comparación de Roles */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>⚖️ Distribución de Usuarios</ThemedText>
          {totalUsers > 0 ? (
            <View>
              <View style={styles.chartContainer}>
                <PieChart
                  data={[
                    {
                      name: 'Administradores',
                      population: adminUsers,
                      color: '#ffa726',
                      legendFontColor: '#ffffff',
                      legendFontSize: 14,
                    },
                    {
                      name: 'Usuarios regulares',
                      population: regularUsers,
                      color: '#66bb6a',
                      legendFontColor: '#ffffff',
                      legendFontSize: 14,
                    },
                  ]}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 10]}
                  absolute
                />
              </View>
              <View style={styles.roleContainer}>
                {statistics.roleComparison.map((role, index) => {
                  const percentage = totalUsers > 0 ? ((role.count / totalUsers) * 100).toFixed(1) : '0';
                  return (
                    <View key={index} style={styles.roleItem}>
                      <View style={styles.roleInfo}>
                        <ThemedText style={styles.roleType}>
                          {role.role_type === 'admin' ? 'Administradores' : 'Usuarios Regulares'}
                        </ThemedText>
                        <ThemedText style={styles.roleCount}>{role.count} usuarios ({percentage}%)</ThemedText>
                      </View>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${percentage}%`,
                              backgroundColor: role.role_type === 'admin' ? '#ff6b6b' : '#4ecdc4'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No hay datos disponibles</ThemedText>
          )}
        </View>

        {/* Solicitudes de Admin por Fecha */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>🔐 Solicitudes de Administrador</ThemedText>
          {statistics.adminRequestsByDate.length > 0 ? (
            <View>
              <View style={styles.chartContainer}>
                <BarChart
                  data={{
                    labels: statistics.adminRequestsByDate.slice(0, 7).map(item => {
                      const date = new Date(item.date);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }).reverse(),
                    datasets: [{
                      data: statistics.adminRequestsByDate.slice(0, 7).map(item => item.count).reverse(),
                    }],
                  }}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </View>
              <View style={styles.listContainer}>
                {statistics.adminRequestsByDate.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <ThemedText style={styles.listDate}>{item.date}</ThemedText>
                    <View style={styles.countBadge}>
                      <ThemedText style={styles.countText}>{item.count}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No hay solicitudes registradas</ThemedText>
          )}
        </View>

        {/* Traducciones por Usuario */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>🌐 Top Usuarios por Traducciones</ThemedText>
          {statistics.translationsByUser.length > 0 ? (
            <View>
              <View style={styles.chartContainer}>
                <BarChart
                  data={{
                    labels: statistics.translationsByUser.slice(0, 6).map(user => user.user_name.substring(0, 8)),
                    datasets: [{
                      data: statistics.translationsByUser.slice(0, 6).map(user => user.translation_count),
                    }],
                  }}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </View>
              <View style={styles.listContainer}>
                {statistics.translationsByUser.slice(0, 5).map((user, index) => (
                  <View key={index} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <ThemedText style={styles.userName}>{user.user_name}</ThemedText>
                      <ThemedText style={styles.userEmail}>{user.user_email}</ThemedText>
                    </View>
                    <View style={styles.countBadge}>
                      <ThemedText style={styles.countText}>{user.translation_count}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No hay traducciones registradas</ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  chartContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    marginVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    marginBottom: 30,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  summaryCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    elevation: 2,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffa726',
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    color: '#ffffff',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#ffffff',
  },
  listContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  listDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  countBadge: {
    backgroundColor: '#ffa726',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  countText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  roleContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
  },
  roleItem: {
    marginBottom: 20,
  },
  roleInfo: {
    marginBottom: 8,
  },
  roleType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  roleCount: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#444444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888888',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});