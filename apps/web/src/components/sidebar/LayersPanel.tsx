import type { CanvasActions, EditorSnapshot } from '../../types/editor';
import { editorStore } from '../../store/editorStore';

type LayersPanelProps = {
  actions: CanvasActions | null;
  snapshot: EditorSnapshot;
};

function LayersPanel(props: LayersPanelProps): JSX.Element {
  /**
   * var: props
   * type: LayersPanelProps
   * desc: Layer panel props with action APIs and latest editor snapshot.
   */
  return (
    <section className="layers-panel">
      <h3>Layers</h3>
      <div className="layers-list">
        {props.snapshot.layers.map((layer) => (
          <div className="layer-item" key={layer.id}>
            <button onClick={() => props.actions?.selectLayer(layer.id)} type="button">{layer.label}</button>
            <div className="layer-buttons">
              <button onClick={() => editorStore.reorderLayer(layer.id, 'up')} type="button">↑</button>
              <button onClick={() => editorStore.reorderLayer(layer.id, 'down')} type="button">↓</button>
              <button onClick={() => editorStore.lockObject(layer.id, !layer.isLocked)} type="button">{layer.isLocked ? '🔒' : '🔓'}</button>
              <button onClick={() => editorStore.toggleVisibility(layer.id)} type="button">{layer.isVisible ? '👁️' : '🙈'}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LayersPanel;
