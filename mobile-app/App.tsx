import React, { useState, useEffect } from 'react';
import { 
  View, TextInput, FlatList, Text, StyleSheet, Platform, 
  ActivityIndicator, TouchableOpacity, SafeAreaView, KeyboardAvoidingView 
} from 'react-native';
import axios from 'axios';

// 1. Cleansed base address to prevent doubling path blocks
const API_URL = 'https://task-master-6ou2.onrender.com';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); 

  // Load token on startup
  useEffect(() => {
    if (Platform.OS === 'web') {
      const savedToken = localStorage.getItem('token');
      if (savedToken) setToken(savedToken);
    }
  }, []);

  // Fetch tasks whenever token changes
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      // 2. Fixed concatenated endpoint query
      const res = await axios.get(`${API_URL}/api/tasks/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setTasks(res.data);
    } catch (error: any) {
      console.error("Fetch error:", error.response?.data || error.message);
    }
  };

  const handleAuth = async () => {
    if (!username || !password) {
      alert("Please enter both username and password");
      return;
    }
    setLoading(true);
    const endpoint = isLoginMode ? 'login' : 'register';
    try {
      // 3. Fixed authorization request routing
      const res = await axios.post(`${API_URL}/api/${endpoint}/`, { username, password });
      const userToken = res.data.token;
      
      if (Platform.OS === 'web') {
        localStorage.setItem('token', userToken);
      }
      setToken(userToken);
      setUsername('');
      setPassword('');
    } catch (error: any) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      alert(`${isLoginMode ? 'Login' : 'Sign up'} failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!taskInput.trim()) return;
    try {
      // 4. Fixed operational task push URI
      const res = await axios.post(
        `${API_URL}/api/tasks/`,
        { title: taskInput }, 
        { headers: { Authorization: `Token ${token}` } }
      );
      setTasks([...tasks, res.data]);
      setTaskInput('');
    } catch (error: any) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      alert(`Failed to add task: ${errorMsg}`);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setTasks([]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Connecting to Task Master...</Text>
      </View>
    );
  }

  // -----------------------------------------
  // SCREEN 1: THE AUTHENTICATION SCREEN
  // -----------------------------------------
  if (!token) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.authSubtitle}>
            {isLoginMode ? 'Enter your details to access your tasks.' : 'Sign up to start organizing your life.'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
            <Text style={styles.primaryButtonText}>{isLoginMode ? 'Login' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchModeButton} onPress={() => setIsLoginMode(!isLoginMode)}>
            <Text style={styles.switchModeText}>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.switchModeTextBold}>{isLoginMode ? 'Sign up here' : 'Login here'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // -----------------------------------------
  // SCREEN 2: THE MAIN DASHBOARD
  // -----------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dashboardContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Task Master</Text>
            <Text style={styles.headerSubtitle}>Let's get things done.</Text>
          </View>
          <TouchableOpacity style={styles.logoutPill} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Task Input Area */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.taskInput}
            placeholder="What needs to be done?"
            placeholderTextColor="#9CA3AF"
            value={taskInput}
            onChangeText={setTaskInput}
          />
          <TouchableOpacity style={styles.addButton} onPress={addTask}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View style={styles.taskCheckCircle} />
              <Text style={styles.taskText}>{item.title}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>✨</Text>
              <Text style={styles.emptyStateText}>You're all caught up!</Text>
              <Text style={styles.emptyStateSub}>Add a task above to begin.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', 
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 15,
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 30,
    padding: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#4F46E5', 
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  switchModeButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#6B7280',
    fontSize: 14,
  },
  switchModeTextBold: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  dashboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  logoutPill: {
    backgroundColor: '#FEE2E2', 
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 25,
    alignItems: 'center',
  },
  taskInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    borderRadius: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32, 
  },
  listContent: {
    paddingBottom: 40,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  taskCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 15,
  },
  taskText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyStateEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptyStateSub: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
});
