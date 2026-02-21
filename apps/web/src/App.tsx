import { useState } from 'react';

import ErrorBoundary from './components/common/ErrorBoundary';
import CanvasEditor from './components/editor/CanvasEditor';
import Sidebar from './components/sidebar/Sidebar';
import PropertiesPanel from './components/sidebar/PropertiesPanel';
import Toolbar from './components/toolbar/Toolbar';
import type {
  CanvasActions,
  EditorSnapshot,
  EditorStatus
} from './types/editor';

const DEFAULT_STATUS: EditorStatus = {
  message: 'Editor ready.',
  state: 'idle'
};

const DEFAULT_SNAPSHOT: EditorSnapshot = {
  layers: [],
  selection: {
    activeGroup: null,
    activeObject: null,
    isEditingGroup: false
  }
};

function App(): JSX.Element {
  /**
   * var: none
   * type: void
   * desc: Composes Canva-inspired workspace and top-level editor state.
   */
  const [actions, setActions] = useState<CanvasActions | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [snapshot, setSnapshot] = useState<EditorSnapshot>(DEFAULT_SNAPSHOT);

  return (
    <ErrorBoundary>
      <div className="layout">
        <Toolbar actions={actions} onStatusChange={setStatus} />
        <div className="status-banner" data-state={status.state}>{status.message}</div>
        <div className="content">
          <Sidebar />
          <CanvasEditor onActionsChange={setActions} onSnapshotChange={setSnapshot} onStatusChange={setStatus} />
          <PropertiesPanel actions={actions} snapshot={snapshot} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
