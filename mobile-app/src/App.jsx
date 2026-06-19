import MobileView from './components/MobileView';

function App() {
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
