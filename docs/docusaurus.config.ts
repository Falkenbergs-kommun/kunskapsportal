import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Kunskapsportal',
  tagline: 'AI-driven kunskapsdatabas för svensk kommunal förvaltning',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // GitHub Pages
  url: 'https://falkenbergs-kommun.github.io',
  baseUrl: '/kunskapsportal/',

  organizationName: 'Falkenbergs-kommun',
  projectName: 'kunskapsportal',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'sv',
    locales: ['sv'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/', // Docs at the root
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Falkenbergs-kommun/kunskapsportal/tree/main/docs/',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Kunskapsportal',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Dokumentation',
        },
        {
          href: 'https://github.com/Falkenbergs-kommun/kunskapsportal',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Dokumentation',
          items: [
            {
              label: 'Översikt',
              to: '/',
            },
            {
              label: 'Installation',
              to: '/installation',
            },
            {
              label: 'Användarguide',
              to: '/user-guide',
            },
          ],
        },
        {
          title: 'Länkar',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Falkenbergs-kommun/kunskapsportal',
            },
            {
              label: 'Falkenbergs kommun',
              href: 'https://falkenberg.se',
            },
          ],
        },
        {
          title: 'Teknologier',
          items: [
            {
              label: 'Payload CMS',
              href: 'https://payloadcms.com',
            },
            {
              label: 'Next.js',
              href: 'https://nextjs.org',
            },
            {
              label: 'Qdrant',
              href: 'https://qdrant.tech',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Utvecklat av utvecklingsavdelningen, Falkenbergs kommun | MIT License`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'javascript', 'json', 'yaml', 'nginx', 'python'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
