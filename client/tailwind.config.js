import tailwindCssAnimate from 'tailwindcss-animate'
import defaultTheme from 'tailwindcss/defaultTheme'

// Define fonts directly to avoid import issues during build
const fonts = ['inter', 'manrope', 'system']

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  safelist: fonts.map((font) => `font-${font}`),
  theme: {
    container: {
      center: 'true',
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        inter: ['Inter', ...defaultTheme.fontFamily.sans],
        manrope: ['Manrope', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        'background-gradient-from': 'hsl(var(--background-gradient-from))',
        'background-gradient-to': 'hsl(var(--background-gradient-to))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--background-gradient-from)), hsl(var(--background-gradient-to)))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(28, 100%, 74%, 1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340, 100%, 76%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(22, 100%, 77%, 1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242, 100%, 70%, 1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 1) 0px, transparent 50%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'gradient-glass-dark': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'gradient-border': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
        'gradient-border-dark': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        'gradient-shimmer': 'linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.5) 50%, transparent 60%)',
        'gradient-aurora': 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
        'gradient-neural': 'radial-gradient(circle at 20% 80%, #120078 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ff0080 0%, transparent 50%), radial-gradient(circle at 40% 40%, #7928ca 0%, transparent 50%)',
        'noise': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'dash': 'dash 1.5s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
        '5xl': '96px',
        '6xl': '128px',
      },
      backdropBrightness: {
        25: '.25',
        175: '1.75',
      },
      backdropSaturate: {
        25: '.25',
        175: '1.75',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'morphism': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'morphism-dark': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.02), 0 1px 0 0 rgba(255, 255, 255, 0.02), 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'neural': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
        'inner-border': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'raycast': '0px 0px 0px 0.5px rgba(255, 255, 255, 0.2), 0px 1px 2px rgba(0, 0, 0, 0.4), 0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 8px rgba(0, 0, 0, 0.1)',
        'linear': '0px 1px 2px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.08), 0px 4px 8px rgba(0, 0, 0, 0.04)',
      },
      borderWidth: {
        '0.5': '0.5px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      blur: {
        '4xl': '72px',
        '5xl': '96px',
        '6xl': '128px',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'dash': {
          '0%': {
            'stroke-dashoffset': '200'
          },
          '100%': {
            'stroke-dashoffset': '0'
          }
        },
        'glow': {
          '0%': {
            'filter': 'brightness(100%) drop-shadow(0 0 0px rgba(59, 130, 246, 0.5))'
          },
          '100%': {
            'filter': 'brightness(110%) drop-shadow(0 0 5px rgba(59, 130, 246, 0.8))'
          }
        },
        'shimmer': {
          '0%': {
            'background-position': '-200% 0'
          },
          '100%': {
            'background-position': '200% 0'
          }
        },
        'float': {
          '0%, 100%': {
            'transform': 'translateY(0px)'
          },
          '50%': {
            'transform': 'translateY(-10px)'
          }
        },
        'morph': {
          '0%, 100%': {
            'border-radius': '60% 40% 30% 70% / 60% 30% 70% 40%'
          },
          '50%': {
            'border-radius': '30% 60% 70% 40% / 50% 60% 30% 60%'
          }
        },
        'breathe': {
          '0%, 100%': {
            'transform': 'scale(1)',
            'opacity': '0.8'
          },
          '50%': {
            'transform': 'scale(1.05)',
            'opacity': '1'
          }
        },
        'slide-up': {
          '0%': {
            'transform': 'translateY(100%)',
            'opacity': '0'
          },
          '100%': {
            'transform': 'translateY(0)',
            'opacity': '1'
          }
        },
        'slide-down': {
          '0%': {
            'transform': 'translateY(-100%)',
            'opacity': '0'
          },
          '100%': {
            'transform': 'translateY(0)',
            'opacity': '1'
          }
        },
        'fade-in': {
          '0%': {
            'opacity': '0',
            'transform': 'translateY(10px)'
          },
          '100%': {
            'opacity': '1',
            'transform': 'translateY(0)'
          }
        },
        'scale-in': {
          '0%': {
            'opacity': '0',
            'transform': 'scale(0.9)'
          },
          '100%': {
            'opacity': '1',
            'transform': 'scale(1)'
          }
        }
      }
    },
  },
  plugins: [tailwindCssAnimate],
}
