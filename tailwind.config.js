/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}', // App Router 支持
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3498db', // 自定义蓝主题
        success: '#27ae60',
        error: '#e74c3c',
        bg: '#f5f7fa',
      },
    },
  },
  plugins: [],
};
