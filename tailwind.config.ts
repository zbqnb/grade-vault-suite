import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: "2rem",
  		screens: {
  			"2xl": "1400px"
  		}
  	},
  	extend: {
  		colors: {
  			border: "hsl(var(--border))",
  			input: "hsl(var(--input))",
  			ring: "hsl(var(--ring))",
  			background: "hsl(var(--background))",
  			foreground: "hsl(var(--foreground))",
  			primary: {
  				DEFAULT: "hsl(var(--primary))",
  				foreground: "hsl(var(--primary-foreground))",
  				light: "hsl(var(--primary-light))"
  			},
  			secondary: {
  				DEFAULT: "hsl(var(--secondary))",
  				foreground: "hsl(var(--secondary-foreground))",
  				light: "hsl(var(--secondary-light))"
  			},
  			accent: {
  				DEFAULT: "hsl(var(--accent))",
  				foreground: "hsl(var(--accent-foreground))",
  				light: "hsl(var(--accent-light))"
  			},
  			warning: {
  				DEFAULT: "hsl(var(--warning))",
  				foreground: "hsl(var(--warning-foreground))",
  				light: "hsl(var(--warning-light))"
  			},
  			success: {
  				DEFAULT: "hsl(var(--success))",
  				foreground: "hsl(var(--success-foreground))",
  				light: "hsl(var(--success-light))"
  			},
  			muted: {
  				DEFAULT: "hsl(var(--muted))",
  				foreground: "hsl(var(--muted-foreground))"
  			},
  			popover: {
  				DEFAULT: "hsl(var(--popover))",
  				foreground: "hsl(var(--popover-foreground))"
  			},
  			card: {
  				DEFAULT: "hsl(var(--card))",
  				foreground: "hsl(var(--card-foreground))"
  			}
  		},
  		borderRadius: {
  			lg: "var(--radius)",
  			md: "calc(var(--radius) - 2px)",
  			sm: "calc(var(--radius) - 4px)"
  		},
  		backgroundImage: {
  			'gradient-primary': 'var(--gradient-primary)',
  			'gradient-secondary': 'var(--gradient-secondary)',
  			'gradient-accent': 'var(--gradient-accent)',
  			'gradient-warm': 'var(--gradient-warm)',
  			'gradient-hero': 'var(--gradient-hero)'
  		},
  		boxShadow: {
  			'soft': 'var(--shadow-soft)',
  			'medium': 'var(--shadow-medium)',
  			'colored': 'var(--shadow-colored)'
  		},
  		keyframes: {
  			"accordion-down": {
  				from: { height: "0" },
  				to: { height: "var(--radix-accordion-content-height)" }
  			},
  			"accordion-up": {
  				from: { height: "var(--radix-accordion-content-height)" },
  				to: { height: "0" }
  			},
  			"float": {
  				"0%, 100%": { transform: "translateY(0px)" },
  				"50%": { transform: "translateY(-10px)" }
  			},
  			"pulse-soft": {
  				"0%, 100%": { opacity: "1" },
  				"50%": { opacity: "0.8" }
  			},
  			"fade-up": {
  				"from": {
  					opacity: "0",
  					transform: "translateY(30px)"
  				},
  				"to": {
  					opacity: "1",
  					transform: "translateY(0)"
  				}
  			},
  			"slide-in": {
  				"from": {
  					opacity: "0",
  					transform: "translateX(-20px)"
  				},
  				"to": {
  					opacity: "1",
  					transform: "translateX(0)"
  				}
  			}
  		},
  		animation: {
  			"accordion-down": "accordion-down 0.2s ease-out",
  			"accordion-up": "accordion-up 0.2s ease-out",
  			"float": "float 6s ease-in-out infinite",
  			"pulse-soft": "pulse-soft 4s ease-in-out infinite",
  			"fade-up": "fade-up 0.8s ease-out forwards",
  			"slide-in": "slide-in 0.6s ease-out forwards"
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;