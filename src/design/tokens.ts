export type ThemePreference = 'light' | 'dark' | 'automatic';
export type ThemeName = 'light' | 'dark';
export const space = { xs: 6, sm: 12, md: 18, lg: 24, xl: 32, xxl: 48 };
export const radius = { card: 24, control: 16, pill: 100 };
export const palettes = {
  light: {
    background: '#EDF7F3', gradient: ['#F3FAF6', '#EAF6FB', '#DAF2E6'] as const,
    surface: '#FFFFFF', surfaceAlt: '#F2F8FA', text: '#102F42', muted: '#526675',
    primary: '#00664B', accent: '#006D50', line: '#D2E3DF', tab: '#F8FCFA',
    mint: '#E2F6E9', blue: '#E5F3FD', violet: '#F0EBFA', coral: '#FFF0EF',
    warning: '#FFF3D6', warningText: '#72500C', progressTrack: '#D8E7E3',
    wave: '#81D8B3', onAccent: '#FFFFFF',
  },
  dark: {
    background: '#061E31', gradient: ['#082B43', '#06394B', '#062032'] as const,
    surface: '#F3F9F9', surfaceAlt: '#E6F1F4', text: '#102F42', muted: '#455E6C',
    primary: '#006D50', accent: '#80E8BD', line: '#CFDFE2', tab: '#08283C',
    mint: '#DBF4E5', blue: '#DCEFFA', violet: '#ECE6F8', coral: '#FCE8E7',
    warning: '#FFF1C9', warningText: '#694800', progressTrack: '#CBDFDC',
    wave: '#0BA78D', onAccent: '#FFFFFF',
  },
};
export type Palette = typeof palettes.light | typeof palettes.dark;
export const resolveTheme = (preference: ThemePreference, system: string | null | undefined): ThemeName =>
  preference === 'automatic' ? (system === 'dark' ? 'dark' : 'light') : preference;
export const parsePreference = (value: string | null): ThemePreference =>
  value === 'light' || value === 'dark' || value === 'automatic' ? value : 'automatic';

/** Colores semánticos compartidos: iconos, gráficos, estados y degradados. */
export const fixed = {"white": "#FFFFFF", "ink": "#102F42", "tabBorderDark": "#1C455B", "tabMutedLight": "#536976", "tabMutedDark": "#C4D8E2", "balance": "#00634B", "income": "#007451", "expense": "#C12945", "successStart": "#008461", "successEnd": "#006458", "onSuccess": "#F0FFF9", "award": "#FFE18B", "heroDarkStart": "#075547", "heroDarkEnd": "#093E51", "heroLightStart": "#DDF6E8", "heroLightEnd": "#DCEFF9", "welcomeMutedDark": "#CEE6E9", "brandOnDark": "#F0FAF8", "brandAccentDark": "#81E8B6", "previewBackdrop": "#00000088", "themeBackdrop": "#00000099", "buttonStart": "#00805C", "buttonEnd": "#006248", "iconMint": "#006B50", "iconBlue": "#0066A5", "iconCoral": "#BB2638", "iconViolet": "#773DB1", "progressStart": "#008464", "progressEnd": "#2FBA91", "waveBlue": "#39BFD0", "waveGreen": "#78D38A", "subtitleDark": "#D2E9EF", "headingDark": "#F4FAFC", "chartHousing": "#0079B5", "chartFood": "#DB384F", "chartTransport": "#CC9B12", "chartServices": "#159DAB", "chartDebt": "#8D54CA", "chartOther": "#008963"} as const;
