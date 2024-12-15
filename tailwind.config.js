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
      '0.25': '0.0625rem',    // 1px
      '0.3': '0.075rem',      // 1.2px
      '0.5': '0.125rem',      // 2px
      '0.75': '0.1875rem',    // 3px
      '1': '0.25rem',         // 4px
      '1.5': '0.375rem',      // 6px
      '2': '0.5rem',          // 8px
      '2.5': '0.625rem',      // 10px
      '3': '0.75rem',         // 12px
      '3.5': '0.875rem',      // 14px
      '4': '1rem',            // 16px
      '5': '1.25rem',         // 20px
      '6': '1.5rem',          // 24px
      '7': '1.75rem',         // 28px
      '8': '2rem',            // 32px
      '9': '2.25rem',         // 36px
      '10': '2.5rem',         // 40px
      '11': '2.75rem',        // 44px
      '12': '3rem',           // 48px
      '14': '3.5rem',         // 56px
      '16': '4rem',           // 64px
      '20': '5rem',           // 80px
      '24': '6rem',           // 96px
      '28': '7rem',           // 112px
      '32': '8rem',           // 128px
      '36': '9rem',           // 144px
      '40': '10rem',          // 160px
      '44': '11rem',          // 176px
      '48': '12rem',          // 192px
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  safelist: [
    // Layout & Spacing - Full spacing scale coverage
    {
      pattern: /^-?(m|p)[trblxy]?-(0|0\.25|0\.3|0\.5|0\.75|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48)$/,
    },
    
    // Individual direction patterns for more specific control
    {
      pattern: /^-?(mt|mb|ml|mr)-(0|0\.25|0\.3|0\.5|0\.75|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48)$/,
    },
    {
      pattern: /^(pt|pb|pl|pr)-(0|0\.25|0\.3|0\.5|0\.75|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48)$/,
    },
    {
      pattern: /^(px|py)-(0|0\.25|0\.3|0\.5|0\.75|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48)$/,
    },

    // Width & Height - Full scale
    {
      pattern: /^(w|h|min-w|min-h|max-w|max-h)-(0|0\.25|0\.3|0\.5|0\.75|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|34|36|38|40|42|44|48|50|52|54|58|60|auto|full|screen)$/,
    },
    {
      pattern: /^max-w-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full)$/,
    },

    // Colors & Backgrounds - Full color scale
    {
      pattern: /^(bg|text|border|outline)-(transparent|current|black|white|gray|zinc|slate|neutral|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-50|-100|-200|-300|-400|-500|-600|-700|-800|-900|-950)?$/,
    },
    
    // Typography
    {
      pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
    },
    {
      pattern: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
    },
    {
      pattern: /^tracking-(tighter|tight|normal|wide|wider|widest)$/,
    },
    {
      pattern: /^leading-(3|4|5|6|7|8|9|10|none|tight|snug|normal|relaxed|loose)$/,
    },
    
    // Flex & Grid
    {
      pattern: /^(flex|grid|gap|space)-([xy])?(0|0\.5|1|2|3|4|5|6|7|8|9|10|11|12|14|16)$/,
    },
    {
      pattern: /^(justify|items|content)-(start|end|center|between|around|evenly)$/,
    },
    
    // Borders & Rounded
    {
      pattern: /^rounded(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?$/,
    },
    {
      pattern: /^(border(-[trbl])?)-([0-9]+|none)$/,
    },
    
    // Effects & Transitions
    {
      pattern: /^(shadow(-sm|-md|-lg|-xl|-2xl|-inner|-none)?)$/,
    },
    {
      pattern: /^(transition(-none|-all|-colors|-opacity|-shadow|-transform)?|duration-([0-9]+)|ease-(linear|in|out|in-out))$/,
    },
    
    // Common Utility Classes
    ...[
      'container',
      'prose',
      'aspect-video',
      'aspect-square',
      'object-cover',
      'object-contain',
      'object-fill',
      'object-none',
      'overflow-hidden',
      'overflow-x-auto',
      'overflow-y-auto',
      'relative',
      'absolute',
      'fixed',
      'sticky',
      'cursor-pointer',
      'cursor-default',
      'cursor-not-allowed',
      'select-none',
      'select-text',
      'sr-only',
      'not-sr-only'
    ]
]
};
