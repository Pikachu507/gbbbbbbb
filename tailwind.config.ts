import type { Config } from 'tailwindcss';
export default {
  content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme:{extend:{colors:{gold:'#efc55d',ink:'#0b0b0b'},boxShadow:{soft:'0 18px 60px rgba(0,0,0,.07)'}}},plugins:[]
} satisfies Config;
