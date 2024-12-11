module.exports = {
  darkMode: 'class',
  content: [
    './_includes/**/*.{html,md}',
    './_layouts/**/*.{html,md}',
    './_courses/**/*.{html,md}',
    './_data/**/*.{yml,json}',
    './*.{html,md}',
    './index.md',
  ],
  theme: {
    extend: {
      width: {
        '2': '0.5rem',
        '4': '0.75rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
      height: {
        '2': '0.5rem',
        '4': '0.75rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
      typography: {
        DEFAULT: {
          css: {
            h1: {
              '@apply text-4xl font-bold mb-6': {},
            },
            h2: {
              '@apply text-3xl font-bold mb-4': {},
            },
            h3: {
              '@apply text-2xl font-bold mb-4': {},
            },
            h4: {
              '@apply text-xl font-bold mb-3': {},
            },
          },
        },
      },
      spacing: {
      '0.5': '0.125rem',
      '1.5': '0.375rem',
      '2.5': '0.625rem',
      '3.5': '0.875rem',
      '4': '1rem',
      '4.5': '1.125rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '6.5': '1.625rem',
      '7': '1.75rem',
      '8': '2rem',
      '10': '2.5rem',
      '14': '3.5rem',  
      '16': '4rem',  
      '18': '4.5rem',
      '20': '5rem',
      '24': '6rem',   
      '26': '6.5rem',
      '28': '7rem',
      '32': '8rem',   
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  safelist: [
    'bg-zinc-900',
    'bg-green-100', 'text-green-800', // Active status
    'bg-gray-100', 'text-gray-600',   // Past status
    'bg-gray-200', 
    'bg-gray-300',
    'bg-gray-400',
    'bg-gray-500',
    'bg-gray-600',
    'bg-gray-700',
    'bg-gray-800', 'text-gray-800',   // Default status
    'bg-gray-900', 'text-gray-100',   // Dark mode
    'bg-gray-950', 'text-gray-50',    // Dark mode
    'bg-blue-100', 'text-blue-800',   // Python
    'bg-orange-100', 'text-orange-800', // Java
    'bg-purple-100', 'text-purple-800', // LaTeX
    'bg-red-100', 'text-red-800',     // PyTorch
    'bg-yellow-100', 'text-yellow-800', // TensorFlow
    'bg-pink-100', 'text-pink-800',   // Julia
    'bg-indigo-100', 'text-indigo-800', // R
    'bg-teal-100', 'text-teal-800',   // C++
    'bg-red-100', 'text-red-800',     // Default status
    'bg-green-50', 'text-green-700', 
    // Spacing classes
    'mb-2', 'mb-4', 'mb-6', 'mb-8', 'mb-12',
    'mt-2', 'mt-4', 'mt-6', 'mt-8', 'mt-12',
    // Width classes
    'w-2', 'w-4', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24',
    'w-2xl', 'w-3xl', 'w-4xl', 'w-5xl', 'w-6xl', 'w-7xl', 'w-8xl',
    'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl',
    // Height classes
    'h-2', 'h-4', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24',
    // Typography classes
    'text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'font-bold', 'mb-6', 'mb-4', 'mb-3',
    // Spacing classes
    'mb-6', 'mb-4', 'mb-3', 'mb-2', 'mb-1', 'mb-0',
    'mt-6', 'mt-4', 'mt-3', 'mt-2', 'mt-1', 'mt-0',
    'ml-6', 'ml-4', 'ml-3', 'ml-2', 'ml-1', 'ml-0',
    'mr-6', 'mr-4', 'mr-3', 'mr-2', 'mr-1', 'mr-0',

    'pt-2', 'pt-4', 'pt-6', 'pt-8', 'pt-12',
    'pb-2', 'pb-4', 'pb-6', 'pb-8', 'pb-12',
    'py-2', 'py-4', 'py-6', 'py-8', 'py-12',
  
  ],
};
