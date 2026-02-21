import { useState } from 'react';

import ErrorBoundary from './components/common/ErrorBoundary';
import CanvasEditor from './components/editor/CanvasEditor';
import Sidebar from './components/sidebar/Sidebar';
import Toolbar from './components/toolbar/Toolbar';
import type {
  CanvasActions,
  EditorStatus
} from './types/editor';

const DEFAULT_STATUS: EditorStatus = {
  message: 'Editor ready.',
  state: 'idle'
};

function App(): JSX.Element {
  /**
   * var: none
   * type: void
   * desc: Composes page-level editor layout and top-level editor state.
   */
  const [actions, setActions] = useState<CanvasActions | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);

  return (
    <ErrorBoundary>
      <div className="layout">
        <Toolbar actions={actions} onStatusChange={setStatus} />
        <div className="status-banner" data-state={status.state}>{status.message}</div>
        <div className="content">
          <Sidebar />
          <CanvasEditor onActionsChange={setActions} onStatusChange={setStatus} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
