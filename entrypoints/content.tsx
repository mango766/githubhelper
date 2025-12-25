import { createRoot } from 'react-dom/client';
import App from '../src/components/App';
import '../src/styles/github-theme.css';

export default defineContentScript({
  matches: ['https://github.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'github-helper',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const root = createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
