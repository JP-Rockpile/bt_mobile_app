import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TermsOfServiceScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function TermsOfServiceScreen({ visible, onClose }: TermsOfServiceScreenProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Terms of Use</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.effectiveDate}>
            Effective Date: January 1, 2025
          </Text>

          <Section title="1. Agreement to Terms">
            <Text style={styles.text}>
              By accessing or using BetThink ("we", "our", or "the Service"), you agree to
              comply with and be bound by these Terms of Use. If you do not agree, do not
              access or use the Service.
            </Text>
          </Section>

          <Section title="2. Eligibility">
            <Text style={styles.text}>
              You must be 18 years or older, or the legal age for gambling in your jurisdiction,
              to use BetThink. You are solely responsible for ensuring your use of the Service
              complies with applicable laws.
            </Text>
          </Section>

          <Section title="3. Description of Service">
            <Text style={styles.text}>
              BetThink is an AI-powered platform that delivers sports-related insights and
              betting-related content. This information is for informational and entertainment
              purposes only and should not be construed as professional advice or a guarantee
              of outcomes.
            </Text>
          </Section>

          <Section title="4. No Warranties">
            <Text style={styles.text}>
              The Service and all information provided through BetThink are offered "as is" and
              "as available" without warranties of any kind. We disclaim all liability arising
              from the use or reliance on any information provided.
            </Text>
          </Section>

          <Section title="5. Responsible Use">
            <Text style={styles.text}>
              Gambling involves financial risk and may lead to addiction. We encourage all users
              to bet responsibly. If you feel that you or someone you know may have a gambling
              problem, please seek help from a licensed support service.
            </Text>
          </Section>

          <Section title="6. User Obligations">
            <Text style={styles.text}>You agree not to:</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletText}>
                • Use BetThink in any unlawful or prohibited manner
              </Text>
              <Text style={styles.bulletText}>
                • Reverse-engineer or tamper with the platform
              </Text>
              <Text style={styles.bulletText}>
                • Misuse or redistribute any part of the content without authorization
              </Text>
            </View>
          </Section>

          <Section title="7. Intellectual Property">
            <Text style={styles.text}>
              All content, trademarks, algorithms, and software on BetThink are the intellectual
              property of BetThink, Inc. or its licensors. Unauthorized use is strictly prohibited.
            </Text>
          </Section>

          <Section title="8. Limitation of Liability">
            <Text style={styles.text}>
              To the maximum extent permitted by law, BetThink and its affiliates are not liable
              for any direct, indirect, incidental, or consequential damages resulting from your
              use of the Service.
            </Text>
          </Section>

          <Section title="9. Modifications to the Service or Terms">
            <Text style={styles.text}>
              We may modify the Service or these Terms at any time. Continued use of BetThink
              after changes are posted indicates acceptance of the revised Terms.
            </Text>
          </Section>

          <Section title="10. Termination">
            <Text style={styles.text}>
              We reserve the right to suspend or terminate your access to the Service at our
              discretion, without prior notice, for violations of these Terms or any applicable law.
            </Text>
          </Section>

          <Section title="11. Governing Law">
            <Text style={styles.text}>
              These Terms shall be governed by and construed under the laws of the State of
              Delaware, United States, without regard to conflict of law principles.
            </Text>
          </Section>

          <Section title="12. Contact Information">
            <Text style={styles.text}>
              If you have any questions or concerns about these Terms, please contact us at:
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>📧 support@betthink.io</Text>
              <Text style={styles.contactText}>🌐 www.betthink.io</Text>
            </View>
          </Section>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  effectiveDate: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 24,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#A3A3A3',
  },
  bulletList: {
    marginTop: 8,
    marginLeft: 8,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#A3A3A3',
    marginBottom: 4,
  },
  contactInfo: {
    marginTop: 12,
    paddingLeft: 8,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});

