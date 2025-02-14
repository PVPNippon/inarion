const { transform } = require('next/dist/build/swc')

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        button: '0px 1px 6px 0px hsla(7, 62%, 47%, 0.1)',
        card: '0px 1px 6px 0px hsla(8, 85%, 58%, 0.08)',
        popover: '0px 1px 6px 0px hsla(8, 85%, 58%, 0.08)',
        dropdownmenu1: '0px 2px 4px -2px hsla(7, 62%, 47%, 0.08)',
        dropdownmenu2: '0px 4px 6px -1px hsla(7, 62%, 47%, 0.08)',
        nav1: '0px 4px 6px -4px hsla(7, 62%, 47%, 0.1)',
        nav2: '0px 10px 15px -3px hsla(7, 62%, 47%, 0.1)',
        menu1: '0px 2px 4px -2px hsla(7, 62%, 47%, 0.1)',
        menu2: '0px 4px 6px -1px hsla(7, 62%, 47%, 0.1)',
        tabs: '0px 1px 2px 0px hsla(7, 62%, 47%, 0.08)',
      },
      gridTemplateColumns: {
        13: 'repeat(13, minmax(0, 1fr))',
      },
      colors: {
        destructiveHover: 'hsla(324, 59%, 49%, 1)',
        buttonHover: 'hsla(13, 89%, 63%, 1)',
        outlineHover: 'hsla(9, 100%, 95%, 1)',
        darkOutline: 'hsl(9, 100%, 85%)',
        darkPrimary: 'hsl(8 85% 45%)' /* Slightly lighter dark shade for active state */,
        darkDestructive: 'hsl(324 100% 25%)',
        blue: {
          400: '#2589FE',
          500: '#0070F3',
          600: '#2F6FEB',
        },
        background: 'hsl(var(--background))',
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
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '4xl': 'var(--radius-4xl)',
      },
      keyframes: {
        'caret-blink': {
          '0%,70%,100%': {
            opacity: '1',
          },
          '20%,50%': {
            opacity: '0',
          },
        },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
    },
    keyframes: {
      shimmer: {
        '100%': {
          transform: 'translateX(100%)',
        },
      },
    },
    keyframes: {
      'fade-in': {
        '0%': {
          opacity: 0,
          transform: 'translateY(-10px)',
        },
        '100%': {
          opacity: 1,
          transform: 'translateY(0)',
        },
      },
      animation: {
        'fade-in': 'fade-in 0.7s ease-in-out forwards',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('tailwindcss-animate')],
}

module.exports = config
