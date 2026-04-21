import DefaultTheme from 'vitepress/theme';
import SmartDownload from './SmartDownload.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: import('vue').App }) {
    app.component('SmartDownload', SmartDownload);
  },
};
