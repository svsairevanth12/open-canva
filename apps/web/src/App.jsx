import EditorPanel from './components/editor/EditorPanel';
import Sidebar from './components/sidebar/Sidebar';
import Toolbar from './components/toolbar/Toolbar';

function App() {
  return (
    <div className="layout">
      <Toolbar />
      <div className="content">
        <Sidebar />
        <EditorPanel />
      </div>
    </div>
  );
}

export default App;
