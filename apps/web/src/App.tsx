import CanvasEditor from './components/editor/CanvasEditor';
import Sidebar from './components/sidebar/Sidebar';
import Toolbar from './components/toolbar/Toolbar';

function App(): JSX.Element {
  /**
   * var: none
   * type: void
   * desc: Composes page-level editor layout.
   */
  return (
    <div className="layout">
      <Toolbar />
      <div className="content">
        <Sidebar />
        <CanvasEditor />
      </div>
    </div>
  );
}

export default App;
