import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { logger } from '@utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error boundary caught error', {
      error: error.toString(),
      errorInfo,
    });

    // Report to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
            
            <Pressable onPress={this.handleReset} style={styles.button}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorDetails: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 11,
    color: '#424242',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});