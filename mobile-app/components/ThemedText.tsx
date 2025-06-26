import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'title' | 'subtitle' | 'defaultSemiBold' | 'link';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  children, 
  style, 
  type = 'default',
  ...props 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <Text 
      style={[
        styles.text, 
        isDark && styles.darkText,
        styles[type],
        isDark && styles[`${type}Dark`],
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#000000',
    fontSize: 16,
  },
  darkText: {
    color: '#FFFFFF',
  },
  default: {},
  defaultDark: {},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  titleDark: {},
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitleDark: {},
  defaultSemiBold: {
    fontWeight: '600',
  },
  defaultSemiBoldDark: {},
  link: {
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
  linkDark: {
    color: '#4DA3FF',
  }
}); 