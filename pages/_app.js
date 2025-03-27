import { AppProvider } from '@shopify/polaris';
import { Provider } from '@shopify/app-bridge-react';
import '@shopify/polaris/build/esm/styles.css';
import { useMemo } from 'react';

function MyApp({ Component, pageProps }) {
  const config = useMemo(() => ({
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
    host: new URLSearchParams(window.location.search).get("host"),
    forceRedirect: true,
  }), []);

  return (
    <AppProvider>
      <Provider config={config}>
        <Component {...pageProps} />
      </Provider>
    </AppProvider>
  );
}

export default MyApp;
