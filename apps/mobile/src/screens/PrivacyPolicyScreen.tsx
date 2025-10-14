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

interface PrivacyPolicyScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyScreen({ visible, onClose }: PrivacyPolicyScreenProps) {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          <View style={styles.titleSection}>
            <Text style={styles.title}>🔒 BetThink – Privacy Policy</Text>
          </View>

          <Text style={styles.effectiveDate}>
            Effective Date: January 1, 2025{'\n'}
            Last Updated: January 1, 2025
          </Text>

          <Section title="1. Introduction">
            <Text style={styles.text}>
              Welcome to BetThink ("we", "our", or "us"). This Privacy Policy explains how we
              collect, use, store, and protect your personal data when you use our application,
              website, and related services ("the Service").
            </Text>
            <Text style={[styles.text, styles.marginTop]}>
              We are committed to protecting your privacy and handling your data transparently
              and securely.
            </Text>
          </Section>

          <Section title="2. Information We Collect">
            <Text style={styles.text}>We may collect the following types of information:</Text>

            <SubSection title="A. Information You Provide Directly">
              <View style={styles.bulletList}>
                <Text style={styles.bulletText}>• Email address (if you register or subscribe)</Text>
                <Text style={styles.bulletText}>• Username or nickname</Text>
                <Text style={styles.bulletText}>• Feedback, support requests, or other messages</Text>
              </View>
            </SubSection>

            <SubSection title="B. Automatically Collected Information">
              <View style={styles.bulletList}>
                <Text style={styles.bulletText}>• Device type and browser</Text>
                <Text style={styles.bulletText}>• IP address and location (general)</Text>
                <Text style={styles.bulletText}>• App usage data (e.g., features used, time spent)</Text>
                <Text style={styles.bulletText}>• Analytics identifiers (e.g., Google Analytics, Mixpanel)</Text>
              </View>
            </SubSection>

            <SubSection title="C. Third-Party Information">
              <View style={styles.bulletList}>
                <Text style={styles.bulletText}>
                  • Data from third-party services you connect (e.g., social login)
                </Text>
                <Text style={styles.bulletText}>
                  • Aggregated or anonymized betting data from partners (non-personal)
                </Text>
              </View>
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            <Text style={styles.text}>We use the information we collect to:</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletText}>• Operate, maintain, and improve BetThink</Text>
              <Text style={styles.bulletText}>• Personalize your experience and insights</Text>
              <Text style={styles.bulletText}>• Respond to user inquiries or support tickets</Text>
              <Text style={styles.bulletText}>• Monitor usage and performance</Text>
              <Text style={styles.bulletText}>• Communicate important updates or service changes</Text>
              <Text style={styles.bulletText}>• Ensure legal and regulatory compliance</Text>
            </View>
          </Section>

          <Section title="4. Legal Bases for Processing (GDPR)">
            <Text style={styles.text}>
              If you are located in the European Economic Area (EEA), we process your personal
              data under the following legal bases:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletText}>• Consent (e.g., for marketing communications)</Text>
              <Text style={styles.bulletText}>
                • Contractual necessity (e.g., providing the app's services)
              </Text>
              <Text style={styles.bulletText}>
                • Legitimate interests (e.g., analytics, fraud prevention)
              </Text>
              <Text style={styles.bulletText}>• Legal obligations</Text>
            </View>
          </Section>

          <Section title="5. Sharing Your Information">
            <Text style={styles.text}>
              We do not sell your personal information. We may share your data with:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletText}>
                • Service providers (e.g., hosting, analytics, email delivery)
              </Text>
              <Text style={styles.bulletText}>
                • Legal authorities when required by law or to enforce our Terms
              </Text>
              <Text style={styles.bulletText}>
                • Business transfers (e.g., in the event of a merger or acquisition)
              </Text>
            </View>
            <Text style={[styles.text, styles.marginTop]}>
              All third-party partners are contractually bound to protect your data in accordance
              with this policy.
            </Text>
          </Section>

          <Section title="6. Data Retention">
            <Text style={styles.text}>
              We retain your information only for as long as necessary to fulfill the purposes
              outlined in this policy or as required by law. You can request deletion of your
              data at any time (see Section 9).
            </Text>
          </Section>

          <Section title="7. Security">
            <Text style={styles.text}>
              We use appropriate technical and organizational measures to protect your data, including:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletText}>• Encryption (in transit and at rest)</Text>
              <Text style={styles.bulletText}>• Secure cloud infrastructure</Text>
              <Text style={styles.bulletText}>• Access controls and monitoring</Text>
            </View>
            <Text style={[styles.text, styles.marginTop]}>
              No system is 100% secure, and we cannot guarantee absolute security.
            </Text>
          </Section>

          <Section title="8. Your Rights">
            <Text style={styles.text}>
              Depending on your location, you may have the following rights:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletText}>• Access the personal data we hold about you</Text>
              <Text style={styles.bulletText}>• Request correction or deletion</Text>
              <Text style={styles.bulletText}>• Object to or restrict processing</Text>
              <Text style={styles.bulletText}>• Data portability (where applicable)</Text>
              <Text style={styles.bulletText}>
                • Withdraw consent (if processing is based on consent)
              </Text>
            </View>
            <Text style={[styles.text, styles.marginTop]}>
              To exercise your rights, contact us at{' '}
              <Text style={styles.linkText}>privacy@betthink.io</Text>.
            </Text>
          </Section>

          <Section title="9. CCPA Notice (California Residents)">
            <Text style={styles.text}>
              If you are a California resident, you have the right to:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletText}>
                • Know what personal data we collect and how we use it
              </Text>
              <Text style={styles.bulletText}>
                • Request access or deletion of your personal data
              </Text>
              <Text style={styles.bulletText}>
                • Opt out of the sale of personal information (we do not sell data)
              </Text>
            </View>
            <Text style={[styles.text, styles.marginTop]}>
              To exercise your CCPA rights, please contact us at{' '}
              <Text style={styles.linkText}>privacy@betthink.io</Text>.
            </Text>
          </Section>

          <Section title="10. Children's Privacy">
            <Text style={styles.text}>
              BetThink is not intended for individuals under the age of 18. We do not knowingly
              collect data from minors. If we become aware that a child has provided us with
              personal data, we will delete it immediately.
            </Text>
          </Section>

          <Section title="11. Changes to This Privacy Policy">
            <Text style={styles.text}>
              We may update this Privacy Policy from time to time. We will notify you of
              significant changes by posting a notice on our app or website. Continued use of
              the Service after changes constitutes acceptance of the updated policy.
            </Text>
          </Section>

          <Section title="12. Contact Us">
            <Text style={styles.text}>
              If you have any questions or concerns about this Privacy Policy or your data,
              contact us at:
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>📧 privacy@betthink.io</Text>
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

interface SubSectionProps {
  title: string;
  children: React.ReactNode;
}

const SubSection: React.FC<SubSectionProps> = ({ title, children }) => {
  return (
    <View style={styles.subSection}>
      <Text style={styles.subSectionTitle}>{title}</Text>
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
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 30,
  },
  effectiveDate: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 24,
    fontStyle: 'italic',
    lineHeight: 20,
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
  subSection: {
    marginTop: 12,
    marginLeft: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5E5',
    marginBottom: 8,
    lineHeight: 22,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#A3A3A3',
  },
  marginTop: {
    marginTop: 12,
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
  linkText: {
    color: '#8B5CF6',
    textDecorationLine: 'underline',
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

