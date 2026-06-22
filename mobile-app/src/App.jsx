import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import MobileView from './components/MobileView';

function App() {
  useEffect(() => {
    const configureStatusBar = async () => {
      try {
        await StatusBar.setBackgroundColor({ color: '#f9fafc' });
        await StatusBar.setStyle({ style: Style.Light });
      } catch (error) {
        console.log('Capacitor StatusBar is not available or not running on a native device.', error);
      }
    };
    configureStatusBar();
  }, []);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '1.5rem' }}>
      {/* Smartphone Simulator */}
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <MobileView />
      </div>
    </div>
  );
}

export default App;
