import React, { useState, useCallback } from 'react';
import { Box, Text, Button, Icon, HStack, VStack, Pressable, Switch, Select, Picker, Input, Modal, useColorModeValue, useColorMode } from 'native-base';
import { useAuth } from '../../contexts/AuthContext';
import { useHabits } from '../../contexts/HabitContext';
import { Card, FormField, Divider, Badge, LoadingOverlay } from '../ui';
import { UserPreferences, Category, Priority } from '../../types';
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from '../../constants';
import { exportAllData, importAllData, clearAllData, getStorageInfo } from '../../services/storage';
import { syncData } from '../../services/firebase';

interface SettingsScreenProps {
  navigation: any;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, firebaseUser, updatePreferences, signOut, loading: authLoading } = useAuth();
  const { habits, entries, achievements, syncData, syncStatus, loading: habitsLoading } = useHabits();
  const { colorMode, toggleColorMode } = useColorMode();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [exportJson, setExportJson] = useState('');
  const [storageInfo, setStorageInfo] = useState<{ habits: number; entries: number; size: number }>({ habits: 0, entries: 0, size: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (user) setPreferences(user.preferences);
  }, [user]);

  React.useEffect(() => {
    loadPreferences();
    getStorageInfo().then(setStorageInfo);
  }, [loadPreferences]);

  const handlePreferenceChange = useCallback(async (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    if (firebaseUser) await updatePreferences(newPrefs);
  }, [preferences, firebaseUser, updatePreferences]);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const data = await exportAllData();
      setExportJson(data);
      setShowExportModal(true);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!importJson.trim()) return;
    setImportLoading(true);
    try {
      await importAllData(importJson);
      setShowImportModal(false);
      setImportJson('');
      navigation.goBack(); // Refresh
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImportLoading(false);
    }
  }, [importJson, navigation]);

  const handleClearData = useCallback(async () => {
    try {
      await clearAllData();
      navigation.goBack();
    } catch (error) {
      console.error('Clear data failed:', error);
    }
  }, [navigation]);

  const bg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box flex={1} bg={bg}>
      <LoadingOverlay visible={authLoading || habitsLoading} text="Loading..." />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Box p={4}>
          <Text fontSize="xl" fontWeight="bold" color={textColor} mb={4}>Settings</Text>

          <Card mb={4}>
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Account</Text>
            {user && (
              <VStack space={3} w="full">
                <HStack space={3} alignItems="center">
                  <Box bg="blue.100" borderRadius="full" size={12} justifyContent="center" alignItems="center">
                    <Icon as="user" size={6} color="blue.500" />
                  </Box>
                  <VStack alignItems="flex-start" space={1}>
                    <Text fontSize="md" fontWeight="semibold" color={textColor}>
                      {user.displayName || user.email.split('@')[0]}
                    </Text>
                    <Text fontSize="sm" color={subTextColor}>{user.email}</Text>
                  </VStack>
                </HStack>
                <Divider />
                <HStack justifyContent="space-between" alignItems="center">
                  <VStack alignItems="flex-start" space={1}>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>Total Habits</Text>
                    <Text fontSize="xs" color={subTextColor}>{habits.filter(h => !h.isArchived).length} active</Text>
                  </VStack>
                  <HStack space={2}>
                    <Badge colorScheme="blue">{entries.length} entries</Badge>
                    <Badge colorScheme="purple">{achievements.length} achievements</Badge>
                  </HStack>
                </HStack>
              </VStack>
            )}
          </Card>

          <Card mb={4}>
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Appearance</Text>
            <VStack space={4} w="full">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="flex-start" space={1}>
                  <Text fontSize="md" fontWeight="medium" color={textColor}>Dark Mode</Text>
                  <Text fontSize="xs" color={subTextColor}>Switch between light and dark theme</Text>
                </VStack>
                <Pressable onPress={toggleColorMode} style={({ pressed }) => ({
                  w: 52, h: 28, borderRadius: 'full', bg: colorMode === 'dark' ? 'blue.500' : 'gray.300', justifyContent: 'center', alignItems: 'center',
                })}>
                  <Box size={20} borderRadius="full" bg="white" style={{ left: colorMode === 'dark' ? 24 : 0 }} />
                </Pressable>
              </HStack>

              <Divider />

              <FormField label="Week Starts On">
                <Select
                  selectedValue={preferences?.weekStartsOn?.toString() || '0'}
                  onValueChange={(v) => handlePreferenceChange('weekStartsOn', parseInt(v) as 0 | 1)}
                  _selectedItem={{ bg: 'blue.100', borderColor: 'blue.500' }}
                >
                  <Picker.Item label="Sunday" value="0" />
                  <Picker.Item label="Monday" value="1" />
                </Select>
              </FormField>

              <Divider />

              <FormField label="Date Format">
                <Select
                  selectedValue={preferences?.dateFormat || 'YYYY-MM-DD'}
                  onValueChange={(v) => handlePreferenceChange('dateFormat', v)}
                  _selectedItem={{ bg: 'blue.100', borderColor: 'blue.500' }}
                >
                  <Picker.Item label="MM/DD/YYYY" value="MM/DD/YYYY" />
                  <Picker.Item label="DD/MM/YYYY" value="DD/MM/YYYY" />
                  <Picker.Item label="YYYY-MM-DD" value="YYYY-MM-DD" />
                </Select>
              </FormField>

              <Divider />

              <FormField label="Time Format">
                <Select
                  selectedValue={preferences?.timeFormat?.toString() || '24'}
                  onValueChange={(v) => handlePreferenceChange('timeFormat', parseInt(v) as 12 | 24)}
                  _selectedItem={{ bg: 'blue.100', borderColor: 'blue.500' }}
                >
                  <Picker.Item label="12 Hour" value="12" />
                  <Picker.Item label="24 Hour" value="24" />
                </Select>
              </FormField>
            </VStack>
          </Card>

          <Card mb={4}>
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Notifications</Text>
            <VStack space={4} w="full">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="flex-start" space={1}>
                  <Text fontSize="md" fontWeight="medium" color={textColor}>Enable Notifications</Text>
                  <Text fontSize="xs" color={subTextColor}>Receive habit reminders and streak alerts</Text>
                </VStack>
                <Switch
                  checked={preferences?.notificationsEnabled ?? true}
                  onValueChange={(v) => handlePreferenceChange('notificationsEnabled', v)}
                  colorScheme="blue"
                />
              </HStack>

              <Divider />

              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="flex-start" space={1}>
                  <Text fontSize="md" fontWeight="medium" color={textColor}>Auto Backup</Text>
                  <Text fontSize="xs" color={subTextColor}>Automatically sync data to cloud</Text>
                </VStack>
                <Switch
                  checked={preferences?.autoBackup ?? true}
                  onValueChange={(v) => handlePreferenceChange('autoBackup', v)}
                  colorScheme="blue"
                />
              </HStack>
            </VStack>
          </Card>

          <Card mb={4}>
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Data & Sync</Text>
            <VStack space={3} w="full">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="flex-start" space={1}>
                  <Text fontSize="md" fontWeight="medium" color={textColor}>Sync Status</Text>
                  <Text fontSize="xs" color={syncStatus.isSyncing ? 'blue.500' : syncStatus.error ? 'red.500' : subTextColor}>
                    {syncStatus.isSyncing ? 'Syncing...' : syncStatus.error ? `Error: ${syncStatus.error}` : syncStatus.lastSyncedAt ? `Last synced ${formatRelativeTime(syncStatus.lastSyncedAt)}` : 'Never synced'}
                  </Text>
                </VStack>
                <Button size="sm" onPress={syncData} isLoading={syncStatus.isSyncing} disabled={syncStatus.isSyncing}>
                  <Icon as="refresh" size={4} mr={2} /> Sync Now
                </Button>
              </HStack>

              <Divider />

              <HStack space={3} w="full">
                <Button flex={1} variant="outline" onPress={handleExport} isLoading={exportLoading}>
                  <Icon as="download" size={4} mr={2} /> Export Data
                </Button>
                <Button flex={1} variant="outline" onPress={() => setShowImportModal(true)}>
                  <Icon as="upload" size={4} mr={2} /> Import Data
                </Button>
              </HStack>

              <Divider />

              <VStack space={2} w="full">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>Storage Usage</Text>
                <HStack space={4} w="full" justifyContent="space-around">
                  <VStack alignItems="center" space={1}>
                    <Text fontSize="xl" fontWeight="bold" color={textColor}>{storageInfo.habits}</Text>
                    <Text fontSize="xs" color={subTextColor}>Habits</Text>
                  </VStack>
                  <VStack alignItems="center" space={1}>
                    <Text fontSize="xl" fontWeight="bold" color={textColor}>{storageInfo.entries}</Text>
                    <Text fontSize="xs" color={subTextColor}>Entries</Text>
                  </VStack>
                  <VStack alignItems="center" space={1}>
                    <Text fontSize="xl" fontWeight="bold" color={textColor}>{formatBytes(storageInfo.size)}</Text>
                    <Text fontSize="xs" color={subTextColor}>Total Size</Text>
                  </VStack>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          <Card mb={4} variant="outlined" style={{ borderColor: 'red.500' }}>
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>Danger Zone</Text>
            <VStack space={3} w="full">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="flex-start" space={1}>
                  <Text fontSize="md" fontWeight="medium" color="red.500">Delete All Data</Text>
                  <Text fontSize="xs" color={subTextColor}>Permanently remove all habits, entries, and settings</Text>
                </VStack>
                <Button colorScheme="red" onPress={() => setShowDeleteConfirm(true)}>
                  <Icon as="trash" size={4} mr={2} /> Delete
                </Button>
              </HStack>
            </VStack>
          </Card>

          <Card mb={4}>
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>About</Text>
            <VStack space={2} w="full">
              <HStack justifyContent="space-between">
                <Text fontSize="md" color={textColor}>Version</Text>
                <Text fontSize="md" fontWeight="medium" color={subTextColor}>1.0.0</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text fontSize="md" color={textColor}>Build</Text>
                <Text fontSize="md" fontWeight="medium" color={subTextColor}>2024.09.17</Text>
              </HStack>
            </VStack>
          </Card>

          <Button w="full" variant="outline" colorScheme="red" onPress={signOut} mt={4}>
            <Icon as="log-out" size={4} mr={2} /> Sign Out
          </Button>
        </Box>
      </ScrollView>

      <Modal visible={showExportModal} onClose={() => setShowExportModal(false)} size="full">
        <Box flex={1} bg={cardBg}>
          <Box p={4} borderBottomWidth={1} borderColor={borderColor} flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text fontSize="xl" fontWeight="bold" color={textColor}>Export Data</Text>
            <Icon onPress={() => setShowExportModal(false)} as="close" size={6} color={subTextColor} />
          </Box>
          <Box flex={1} p={4}>
            <Text fontSize="sm" color={subTextColor} mb={3}>Copy the JSON below to backup your data:</Text>
            <Box bg={bg} borderRadius="lg" p={3} flex={1} maxH={400}>
              <Text fontSize="xs" fontFamily="monospace" color={textColor} numberOfLines={50}>{exportJson}</Text>
            </Box>
            <HStack space={3} w="full" justifyContent="flex-end" mt={4}>
              <Button variant="ghost" onPress={() => setShowExportModal(false)}>Close</Button>
              <Button onPress={() => { /* Copy to clipboard */ }}>Copy to Clipboard</Button>
            </HStack>
          </Box>
        </Box>
      </Modal>

      <Modal visible={showImportModal} onClose={() => setShowImportModal(false)} size="full">
        <Box flex={1} bg={cardBg}>
          <Box p={4} borderBottomWidth={1} borderColor={borderColor} flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text fontSize="xl" fontWeight="bold" color={textColor}>Import Data</Text>
            <Icon onPress={() => setShowImportModal(false)} as="close" size={6} color={subTextColor} />
          </Box>
          <Box flex={1} p={4}>
            <Text fontSize="sm" color={subTextColor} mb={3}>Paste your exported JSON data:</Text>
            <Input
              multiline
              numberOfLines={20}
              value={importJson}
              onChangeText={setImportJson}
              placeholder='{"version":1,"habits":[],"entries":[]...}'
              bg={bg}
              borderColor={borderColor}
              _focus={{ borderColor: 'blue.500' }}
              fontFamily="monospace"
              fontSize="xs"
            />
            <HStack space={3} w="full" justifyContent="flex-end" mt={4}>
              <Button variant="ghost" onPress={() => { setShowImportModal(false); setImportJson(''); }}>Cancel</Button>
              <Button onPress={handleImport} isLoading={importLoading} colorScheme="blue">Import</Button>
            </HStack>
          </Box>
        </Box>
      </Modal>

      <Modal visible={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
        <Box p={4} bg={cardBg}>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={2}>Delete All Data?</Text>
          <Text fontSize="md" color={subTextColor} mb={4}>This action cannot be undone. All your habits, entries, and achievements will be permanently deleted.</Text>
          <HStack space={3} w="full" justifyContent="flex-end">
            <Button variant="ghost" onPress={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button colorScheme="red" onPress={handleClearData}>Delete Everything</Button>
          </HStack>
        </Box>
      </Modal>
    </Box>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}