import { useMemo, useState } from 'react';

import ErrorBoundary from './components/common/ErrorBoundary';
import HomePage from './components/home/HomePage';
import CanvasEditor from './components/editor/CanvasEditor';
import Sidebar from './components/sidebar/Sidebar';
import PropertiesPanel from './components/sidebar/PropertiesPanel';
import Toolbar from './components/toolbar/Toolbar';
import type {
  CanvasActions,
  EditorSnapshot,
  EditorStatus,
  StoredDesign,
  StoredDesignKind
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

const STORED_DESIGNS_KEY = 'open-canva-designs';

function loadStoredDesigns(): StoredDesign[] {
  /**
   * var: none
   * type: void
   * desc: Restores persisted uploaded designs from local storage.
   */
  const rawValue = localStorage.getItem(STORED_DESIGNS_KEY);
  if (!rawValue) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue) as StoredDesign[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredDesigns(designs: StoredDesign[]): void {
  /**
   * var: designs
   * type: StoredDesign[]
   * desc: Updated uploaded design collection persisted for future sessions.
   */
  localStorage.setItem(STORED_DESIGNS_KEY, JSON.stringify(designs));
}

function fileToDataUrl(file: File): Promise<string> {
  /**
   * var: file
   * type: File
   * desc: Asset file converted into persisted data URL payload.
   */
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
    reader.readAsDataURL(file);
  });
}

function inferDesignKind(file: File): StoredDesignKind {
  /**
   * var: file
   * type: File
   * desc: Uploaded file inspected to determine persisted design kind.
   */
  if (file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg')) {
    return 'svg';
  }
  return 'image';
}

function App(): JSX.Element {
  /**
   * var: none
   * type: void
   * desc: Composes home and editor workspaces with persistent uploads and design selection.
   */
  const [actions, setActions] = useState<CanvasActions | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [snapshot, setSnapshot] = useState<EditorSnapshot>(DEFAULT_SNAPSHOT);
  const [view, setView] = useState<'editor' | 'home'>('home');
  const [designs, setDesigns] = useState<StoredDesign[]>(() => loadStoredDesigns());
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);

  const activeDesign = useMemo((): StoredDesign | null => {
    /**
     * var: none
     * type: void
     * desc: Resolves selected design record for editor hydration.
     */
    if (!activeDesignId) {
      return null;
    }
    return designs.find((design) => design.id === activeDesignId) ?? null;
  }, [activeDesignId, designs]);

  const handleCreateDesign = (): void => {
    /**
     * var: none
     * type: void
     * desc: Opens editor workspace without preselected persisted design.
     */
    setActiveDesignId(null);
    setView('editor');
    setStatus({
      message: 'New design started.',
      state: 'success'
    });
  };

  const handleOpenDesign = (designId: string): void => {
    /**
     * var: designId
     * type: string
     * desc: Persisted design identifier to open inside editor workspace.
     */
    setActiveDesignId(designId);
    setView('editor');
    setStatus({
      message: 'Loaded your previous design.',
      state: 'success'
    });
  };

  const handleUploadAsset = async (file: File): Promise<void> => {
    /**
     * var: file
     * type: File
     * desc: Uploaded file persisted in design history and opened in editor.
     */
    const dataUrl = await fileToDataUrl(file);
    const nextDesign: StoredDesign = {
      dataUrl,
      id: `${Date.now()}`,
      kind: inferDesignKind(file),
      name: file.name,
      updatedAt: new Date().toISOString()
    };
    const nextDesigns = [nextDesign, ...designs].slice(0, 24);
    setDesigns(nextDesigns);
    saveStoredDesigns(nextDesigns);
    setActiveDesignId(nextDesign.id);
    setView('editor');
    setStatus({
      message: 'Uploaded and opened in editor.',
      state: 'success'
    });
  };

  if (view === 'home') {
    return (
      <ErrorBoundary>
        <HomePage designs={designs} onCreateDesign={handleCreateDesign} onOpenDesign={handleOpenDesign} onUploadAsset={handleUploadAsset} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="layout">
        <Toolbar actions={actions} onGoHome={() => setView('home')} onStatusChange={setStatus} />
        <div className="status-banner" data-state={status.state}>{status.message}</div>
        <div className="content">
          <Sidebar />
          <CanvasEditor initialDesign={activeDesign} onActionsChange={setActions} onSnapshotChange={setSnapshot} onStatusChange={setStatus} />
          <PropertiesPanel actions={actions} snapshot={snapshot} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
