import { useEffect, useState } from 'react';
import { Page, Layout, Button, Card, Spinner } from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import axios from 'axios';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await axios.get('/api/script-status');
        setEnabled(res.data.enabled);
      } catch (error) {
        console.error('Erreur récupération statut script :', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const endpoint = enabled ? '/api/disable-script' : '/api/enable-script';
      await axios.post(endpoint);
      setEnabled(!enabled);
    } catch (error) {
      console.error('Erreur mise à jour script :', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Cart Drawer">
      <TitleBar title="Cart Drawer" />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            {loading ? (
              <Spinner />
            ) : (
              <Button onClick={handleToggle} primary={!enabled} destructive={enabled}>
                {enabled ? 'Désactiver le drawer' : 'Activer le drawer'}
              </Button>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
