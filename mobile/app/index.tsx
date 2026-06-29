import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEY = '@samaagum_config';

export default function App() {
  const [ipAddress, setIpAddress] = useState('192.168.1.');
  const [clientPort, setClientPort] = useState('8080');
  const [backendPort, setBackendPort] = useState('3000');
  const [prodUrl, setProdUrl] = useState('https://samaagum.com');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWebViewLoading, setIsWebViewLoading] = useState(false);

  // Load saved config on startup
  useEffect(() => {
    async function loadConfig() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.ipAddress) setIpAddress(parsed.ipAddress);
          if (parsed.clientPort) setClientPort(parsed.clientPort);
          if (parsed.backendPort) setBackendPort(parsed.backendPort);
          if (parsed.prodUrl) setProdUrl(parsed.prodUrl);
        }
      } catch (e) {
        console.error('Failed to load configuration:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Save config helper
  const saveConfig = async (ip: string, cp: string, bp: string, pu: string) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ipAddress: ip, clientPort: cp, backendPort: bp, prodUrl: pu })
      );
    } catch (e) {
      console.error('Failed to save configuration:', e);
    }
  };

  const handleConnectDev = () => {
    saveConfig(ipAddress, clientPort, backendPort, prodUrl);
    const cleanedIp = ipAddress.trim();
    // Path to the root folder to load the landing page & login flow first
    const url = `http://${cleanedIp}:${clientPort}/`;
    setActiveUrl(url);
  };

  const handleConnectProd = () => {
    saveConfig(ipAddress, clientPort, backendPort, prodUrl);
    setActiveUrl(prodUrl);
  };

  const handleExit = () => {
    setActiveUrl(null);
    setIsWebViewLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6d5efc" />
      </View>
    );
  }

  if (activeUrl) {
    const isDev = activeUrl.includes('8080') || activeUrl.includes('localhost') || activeUrl.includes('192.168.');
    
    // Inject script to rewrite API/WebSocket requests to the computer's backend port (3000)
    const injectedJs = `
      (function() {
        const computerIp = '${ipAddress.trim()}';
        const clientPort = '${clientPort.trim()}';
        const backendPort = '${backendPort.trim()}';
        const isDev = ${isDev};

        if (!isDev) return;

        // Override Fetch
        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
          let url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input && input.url ? input.url : ''));
          
          if (url) {
            let modified = false;
            if (url.includes('localhost:' + backendPort)) {
              url = url.replace('localhost:' + backendPort, computerIp + ':' + backendPort);
              modified = true;
            }
            if (url.includes('localhost:' + clientPort)) {
              url = url.replace('localhost:' + clientPort, computerIp + ':' + clientPort);
              modified = true;
            }
            if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
              url = 'http://' + computerIp + ':' + backendPort + url;
              modified = true;
            } else if (url.includes(':' + clientPort + '/api/')) {
              url = url.replace(':' + clientPort + '/api/', ':' + backendPort + '/api/');
              modified = true;
            } else if (url.includes(':' + clientPort + '/uploads/')) {
              url = url.replace(':' + clientPort + '/uploads/', ':' + backendPort + '/uploads/');
              modified = true;
            }

            if (modified) {
              if (typeof input === 'string') {
                input = url;
              } else if (input instanceof URL) {
                input = new URL(url);
              } else if (input && typeof input === 'object' && input.url) {
                input = new Request(url, input);
              }
            }
          }
          return originalFetch(input, init);
        };

        // Override XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          if (typeof url === 'string') {
            if (url.includes('localhost:' + backendPort)) {
              url = url.replace('localhost:' + backendPort, computerIp + ':' + backendPort);
            }
            if (url.includes('localhost:' + clientPort)) {
              url = url.replace('localhost:' + clientPort, computerIp + ':' + clientPort);
            }
            if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
              url = 'http://' + computerIp + ':' + backendPort + url;
            } else if (url.includes(':' + clientPort + '/api/')) {
              url = url.replace(':' + clientPort + '/api/', ':' + backendPort + '/api/');
            } else if (url.includes(':' + clientPort + '/uploads/')) {
              url = url.replace(':' + clientPort + '/uploads/', ':' + backendPort + '/uploads/');
            }
          }
          return originalOpen.call(this, method, url, ...args);
        };

        // Override WebSocket
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
          if (typeof url === 'string') {
            if (url.includes('localhost:' + backendPort)) {
              url = url.replace('localhost:' + backendPort, computerIp + ':' + backendPort);
            }
            if (url.includes('localhost:' + clientPort)) {
              url = url.replace('localhost:' + clientPort, computerIp + ':' + clientPort);
            }
            if (url.includes(':' + clientPort + '/socket.io/')) {
              url = url.replace(':' + clientPort + '/socket.io/', ':' + backendPort + '/socket.io/');
            }
          }
          return new originalWebSocket(url, protocols);
        };

        // Override io (Socket.io)
        let ioVal;
        Object.defineProperty(window, 'io', {
          get() { return ioVal; },
          set(val) {
            ioVal = function(url, options) {
              if (typeof url === 'string') {
                if (url.includes('localhost:' + backendPort)) {
                  url = url.replace('localhost:' + backendPort, computerIp + ':' + backendPort);
                }
                if (url.includes('localhost:' + clientPort)) {
                  url = url.replace('localhost:' + clientPort, computerIp + ':' + clientPort);
                }
                if (url.startsWith('/')) {
                  url = 'http://' + computerIp + ':' + backendPort + url;
                } else if (url.includes(':' + clientPort + '/')) {
                  url = url.replace(':' + clientPort + '/', ':' + backendPort + '/');
                }
              }
              return val(url, options);
            };
          },
          configurable: true
        });

        // Override Image.src
        try {
          const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
          Object.defineProperty(HTMLImageElement.prototype, 'src', {
            get() { return originalSrc.get.call(this); },
            set(value) {
              if (typeof value === 'string') {
                if (value.startsWith('/uploads/')) {
                  value = 'http://' + computerIp + ':' + backendPort + value;
                } else if (value.includes('localhost:' + backendPort + '/uploads/')) {
                  value = value.replace('localhost:' + backendPort, computerIp + ':' + backendPort);
                } else if (value.includes(':' + clientPort + '/uploads/')) {
                  value = value.replace(':' + clientPort + '/uploads/', ':' + backendPort + '/uploads/');
                }
              }
              originalSrc.set.call(this, value);
            }
          });
        } catch (e) {
          console.error(e);
        }
      })();
      true;
    `;

    const paddingTop = Platform.OS === 'ios' ? 50 : 0;
    return (
      <View style={[styles.webContainer, { paddingTop }]}>
        <StatusBar style="light" />
        <WebView
          source={{ uri: activeUrl }}
          injectedJavaScriptBeforeContentLoaded={injectedJs}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          startInLoadingState={true}
          onLoadStart={() => setIsWebViewLoading(true)}
          onLoadEnd={() => setIsWebViewLoading(false)}
          style={{ flex: 1 }}
        />
        {isWebViewLoading && (
          <ActivityIndicator size="large" color="#6d5efc" style={styles.webLoader} />
        )}
        <TouchableOpacity style={styles.exitButton} onPress={handleExit} activeOpacity={0.7}>
          <Text style={styles.exitButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <Text style={styles.appTitle}>Samaagum Mobile</Text>
          <Text style={styles.appSubtitle}>Expo WebView Wrapper</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development Configuration</Text>
            
            <Text style={styles.label}>Computer Local IP Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 192.168.1.50"
              placeholderTextColor="#888"
              value={ipAddress}
              onChangeText={setIpAddress}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>
              Tip: Find your Mac's IP in System Settings → Wi-Fi → Details.
            </Text>

            <View style={styles.row}>
              <View style={[styles.column, { marginRight: 8 }]}>
                <Text style={styles.label}>Client Port</Text>
                <TextInput
                  style={styles.input}
                  value={clientPort}
                  onChangeText={setClientPort}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.column, { marginLeft: 8 }]}>
                <Text style={styles.label}>Backend Port</Text>
                <TextInput
                  style={styles.input}
                  value={backendPort}
                  onChangeText={setBackendPort}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.buttonDev} onPress={handleConnectDev} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Connect to Dev Server</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Production Domain</Text>
            <TextInput
              style={styles.input}
              placeholder="https://samaagum.com"
              placeholderTextColor="#888"
              value={prodUrl}
              onChangeText={setProdUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <TouchableOpacity style={styles.buttonProd} onPress={handleConnectProd} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Launch Production Web App</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0b16',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c0b16',
  },
  card: {
    backgroundColor: '#17152c',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2e2b54',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#a59efc',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a59efc',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0c0b16',
    borderWidth: 1,
    borderColor: '#2e2b54',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 11,
    color: '#716ca3',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  buttonDev: {
    backgroundColor: '#6d5efc',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#6d5efc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonProd: {
    backgroundColor: '#1b1a36',
    borderWidth: 1,
    borderColor: '#4d488e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#2e2b54',
  },
  dividerText: {
    color: '#716ca3',
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#0c0b16',
  },
  webLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  exitButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: 'rgba(23, 21, 44, 0.85)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#2e2b54',
  },
  exitButtonText: {
    fontSize: 22,
  },
});
