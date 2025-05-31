// Import CSS files
import './effects.css';

// Export styles
export const styles = {
  // Export any style constants or theme values here
  colors: {
    primary: {
      blue: '#3b82f6',
      purple: '#8b5cf6',
      pink: '#ec4899',
      green: '#10b981',
      red: '#ef4444',
      yellow: '#f59e0b',
    },
    neon: {
      blue: '#60a5fa',
      purple: '#a78bfa',
      pink: '#f472b6',
      green: '#34d399',
      red: '#f87171',
      yellow: '#fbbf24',
    },
  },
  
  // Animation durations
  animations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    gradient: '8s',
  },
  
  // Shadow values
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  
  // Border radius values
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
};
