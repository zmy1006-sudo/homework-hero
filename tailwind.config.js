/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				// 莫兰迪色系 (Morandi Colors)
				morandi: {
					// 灰粉色
					pink: {
						50: '#F7F3F2',
						100: '#EBE4E1',
						200: '#D9C9C3',
						300: '#C4A8A0',
						400: '#B38B81',
						500: '#A6756A',
						600: '#8F6158',
						700: '#755049',
						800: '#5E423D',
						900: '#4E3734',
					},
					// 灰蓝色
					blue: {
						50: '#F0F4F7',
						100: '#DFE7ED',
						200: '#C2D2DB',
						300: '#9FB7C5',
						400: '#7D9CB0',
						500: '#6383A0',
						600: '#536D88',
						700: '#44596E',
						800: '#394958',
						900: '#313D48',
					},
					// 灰绿色
					green: {
						50: '#F2F5F3',
						100: '#E3EAE5',
						200: '#CAD4CD',
						300: '#ACBAB3',
						400: '#919E96',
						500: '#7A857C',
						600: '#666E66',
						700: '#545A53',
						800: '#464A44',
						900: '#3C3F3C',
					},
					// 灰紫色
					purple: {
						50: '#F3F2F5',
						100: '#E5E3EA',
						200: '#CDC9D7',
						300: '#B1ACBF',
						400: '#968EA5',
						500: '#7F748D',
						600: '#6A6077',
						700: '#584F63',
						800: '#494352',
						900: '#3D3944',
					},
					// 米灰色 (Beige)
					beige: {
						50: '#F8F6F3',
						100: '#F0EBE4',
						200: '#E2D9CB',
						300: '#D1C4AE',
						400: '#C2B296',
						500: '#B5A183',
						600: '#9F896D',
						800: '#7A6B56',
						900: '#615749',
					},
					// 焦糖色 (Caramel)
					caramel: {
						50: '#F7F3EF',
						100: '#EDE5DC',
						200: '#DCCBB9',
						300: '#C9AE93',
						400: '#B89472',
						500: '#A87F5A',
						600: '#8F6B4B',
						700: '#75573E',
						800: '#5E4834',
						900: '#4D3C2C',
					},
					// 灰褐色
					taupe: {
						50: '#F4F2F0',
						100: '#E8E3DF',
						200: '#D3CAC2',
						300: '#BAAEA2',
						400: '#A59587',
						500: '#928070',
						600: '#7A6B5C',
						700: '#64584D',
						800: '#524841',
						900: '#443C36',
					},
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#8B9A8B', // 莫兰迪灰绿色
					foreground: '#FFFFFF',
				},
				secondary: {
					DEFAULT: '#B4A9B0', // 莫兰迪灰紫色
					foreground: '#FFFFFF',
				},
				accent: {
					DEFAULT: '#C4B8A8', // 莫兰迪米色
					foreground: '#4A4A4A',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
