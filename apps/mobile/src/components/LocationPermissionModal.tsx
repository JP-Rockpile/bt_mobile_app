import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LocationPermissionModalProps {
  visible: boolean;
  isLoading: boolean;
  error?: string | null;
  onRequestPermission: () => void;
  onSkip: () => void;
  onOpenSettings?: () => void;
  permissionDenied?: boolean;
}

export default function LocationPermissionModal({
  visible,
  isLoading,
  error,
  onRequestPermission,
  onSkip,
  onOpenSettings,
  permissionDenied = false,
}: LocationPermissionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={48} color="#8B5CF6" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {permissionDenied ? 'Location Access Required' : 'Enable Location Services'}
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              {permissionDenied
                ? 'To show you sportsbooks available in your state, we need location access. Please enable it in your device settings.'
                : 'We use your location to show you sportsbooks that are legally available in your state. This helps ensure you have access to the best betting options in your area.'}
            </Text>

            {/* Features List */}
            {!permissionDenied && (
              <View style={styles.featuresList}>
                <FeatureItem
                  icon="shield-checkmark-outline"
                  text="Only used to determine your state"
                />
                <FeatureItem
                  icon="lock-closed-outline"
                  text="Not shared with third parties"
                />
                <FeatureItem
                  icon="eye-off-outline"
                  text="Not continuously tracked"
                />
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {permissionDenied ? (
                <>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onOpenSettings || (() => Linking.openSettings())}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.primaryButtonText}>Open Settings</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onSkip}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>Skip for Now</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={onRequestPermission}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <View style={styles.buttonGradient}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.primaryButtonText}>Enable Location</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onSkip}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>Skip for Now</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              You can change this permission anytime in Settings
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

interface FeatureItemProps {
  icon: string;
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, text }) => {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color="#8B5CF6" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#A3A3A3',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#D4D4D4',
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7F1D1D',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    color: '#FCA5A5',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A3A3A3',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footerNote: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
    marginTop: 16,
  },
});

