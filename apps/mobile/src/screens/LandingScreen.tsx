import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../stores/auth.store';
import TermsOfServiceScreen from './TermsOfServiceScreen';
import PrivacyPolicyScreen from './PrivacyPolicyScreen';

export default function LandingScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleAuth = async (isSignUp: boolean = false) => {
    if (!disclaimerAccepted) {
      setShowDisclaimerModal(true);
      return;
    }

    try {
      setIsLoading(true);
      await login();
      onAuthenticated();
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisclaimerAccept = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimerModal(false);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoPlaceholder}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Ionicons name="analytics-outline" size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>BetThink.io</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <FeatureItem
              icon="chatbubble-ellipses-outline"
              title="AI Chat Assistant"
              description="Chat with our AI for personalized betting insights"
            />
            <FeatureItem
              icon="stats-chart-outline"
              title="Real-time Analysis"
              description="Get live odds and game predictions"
            />
            <FeatureItem
              icon="shield-checkmark-outline"
              title="Responsible Betting"
              description="Tools to help you bet responsibly"
            />
          </View>

          {/* Disclaimer Checkbox */}
          <View style={styles.disclaimerSection}>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, disclaimerAccepted && styles.checkboxChecked]}>
                  {disclaimerAccepted && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.disclaimerText}>
                I am 21+ and acknowledge that gambling involves risk. I agree to the{' '}
                <Text style={styles.disclaimerLink} onPress={() => setShowTerms(true)}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={styles.disclaimerLink} onPress={() => setShowPrivacy(true)}>
                  Privacy Policy
                </Text>.
              </Text>
            </View>
          </View>

          {/* Auth Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={() => handleAuth(false)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Log In</Text>
                  </LinearGradient>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
              onPress={() => handleAuth(true)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              New to sports betting? We'll guide you through the basics.
            </Text>
          </View>
        </View>

        {/* Terms of Service Modal */}
        <TermsOfServiceScreen visible={showTerms} onClose={() => setShowTerms(false)} />

        {/* Privacy Policy Modal */}
        <PrivacyPolicyScreen visible={showPrivacy} onClose={() => setShowPrivacy(false)} />

        {/* Disclaimer Modal */}
        <Modal
          visible={showDisclaimerModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDisclaimerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="warning-outline" size={48} color="#F59E0B" />
                <Text style={styles.modalTitle}>Important Notice</Text>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalText}>
                  Before continuing, please read and accept our terms:
                </Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Age Requirement</Text>
                  <Text style={styles.modalSectionText}>
                    You must be 21 years or older to use this application.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Gambling Awareness</Text>
                  <Text style={styles.modalSectionText}>
                    Gambling involves financial risk. Only bet what you can afford to lose.
                    If you or someone you know has a gambling problem, call the National
                    Problem Gambling Helpline at 1-800-522-4700.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Terms & Privacy</Text>
                  <Text style={styles.modalSectionText}>
                    By proceeding, you agree to our{' '}
                    <Text
                      style={styles.modalLink}
                      onPress={() => {
                        setShowDisclaimerModal(false);
                        setTimeout(() => setShowTerms(true), 300);
                      }}
                    >
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text
                      style={styles.modalLink}
                      onPress={() => {
                        setShowDisclaimerModal(false);
                        setTimeout(() => setShowPrivacy(true), 300);
                      }}
                    >
                      Privacy Policy
                    </Text>
                    . We collect and process data as described in our policies.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={() => setShowDisclaimerModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={handleDisclaimerAccept}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.modalPrimaryButtonText}>I Accept</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={20} color="#8B5CF6" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  featuresSection: {
    marginBottom: 20,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#737373',
  },
  disclaimerSection: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#404040',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#A3A3A3',
  },
  disclaimerLink: {
    color: '#8B5CF6',
    textDecorationLine: 'underline',
  },
  buttonSection: {
    gap: 10,
  },
  primaryButton: {
    height: 50,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#737373',
    marginTop: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  modalBody: {
    maxHeight: 300,
    marginBottom: 24,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#A3A3A3',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#A3A3A3',
  },
  modalLink: {
    color: '#8B5CF6',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalSecondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A3A3A3',
  },
  modalPrimaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

