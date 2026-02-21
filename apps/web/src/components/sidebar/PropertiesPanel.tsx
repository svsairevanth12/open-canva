import {
  ChangeEvent,
  useMemo
} from 'react';

import type {
  CanvasActions,
  EditorSnapshot,
  PropertyPanelState
} from '../../types/editor';

type PropertiesPanelProps = {
  actions: CanvasActions | null;
  snapshot: EditorSnapshot;
};

function mapPanelState(snapshot: EditorSnapshot): PropertyPanelState {
  /**
   * var: snapshot
   * type: EditorSnapshot
   * desc: Snapshot containing active selection and layers.
   */
  const activeObject = snapshot.selection.activeObject;
  const fillValue = typeof activeObject?.get('fill') === 'string' ? activeObject.get('fill') as string : '#111111';
  const fontSizeValue = typeof activeObject?.get('fontSize') === 'number' ? activeObject.get('fontSize') as number : 52;
  const fontFamilyValue = typeof activeObject?.get('fontFamily') === 'string' ? activeObject.get('fontFamily') as string : 'Open Sans';
  const opacityValue = typeof activeObject?.get('opacity') === 'number' ? activeObject.get('opacity') as number : 1;
  return {
    fill: fillValue,
    fontFamily: fontFamilyValue,
    fontSize: fontSizeValue,
    isBold: activeObject?.get('fontWeight') === 'bold',
    isItalic: activeObject?.get('fontStyle') === 'italic',
    isUnderline: Boolean(activeObject?.get('underline')),
    opacity: opacityValue,
    selectedText: activeObject?.type === 'i-text' ? activeObject as any : null
  };
}

function PropertiesPanel(props: PropertiesPanelProps): JSX.Element {
  /**
   * var: props
   * type: PropertiesPanelProps
   * desc: Action handlers and editor snapshot for style/layer controls.
   */
  const panelState = useMemo(() => mapPanelState(props.snapshot), [props.snapshot]);

  const applyNumberStyle = (event: ChangeEvent<HTMLInputElement>, field: 'fontSize' | 'letterSpacing' | 'lineHeight' | 'rotation'): void => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: Numeric input event used for text/object numeric controls.
     * var: field
     * type: 'fontSize' | 'letterSpacing' | 'lineHeight' | 'rotation'
     * desc: Target style field to update.
     */
    const value = Number(event.target.value);
    if (field === 'rotation') {
      props.actions?.applyObjectStyle({ rotation: value });
      return;
    }
    props.actions?.applyTextStyle({ [field]: value });
  };

  return (
    <aside className="properties-panel">
      <h3>Design Controls</h3>
      <div className="property-group">
        <label htmlFor="fillColor">Fill</label>
        <input id="fillColor" onChange={(event) => props.actions?.applyObjectStyle({ fill: event.target.value })} type="color" value={panelState.fill} />
      </div>
      <div className="property-group">
        <label htmlFor="opacityRange">Opacity</label>
        <input id="opacityRange" max="1" min="0.1" onChange={(event) => props.actions?.applyObjectStyle({ opacity: Number(event.target.value) })} step="0.05" type="range" value={panelState.opacity} />
      </div>
      <div className="property-group">
        <label htmlFor="fontFamily">Font</label>
        <select id="fontFamily" onChange={(event) => props.actions?.applyTextStyle({ fontFamily: event.target.value })} value={panelState.fontFamily}>
          <option value="Open Sans">Open Sans</option>
          <option value="Poppins">Poppins</option>
          <option value="Inter">Inter</option>
          <option value="Montserrat">Montserrat</option>
        </select>
      </div>
      <div className="property-group">
        <label htmlFor="fontSize">Font size</label>
        <input id="fontSize" min="8" onChange={(event) => applyNumberStyle(event, 'fontSize')} type="number" value={panelState.fontSize} />
      </div>
      <div className="property-group">
        <label htmlFor="lineHeight">Line height</label>
        <input id="lineHeight" min="0.8" onChange={(event) => applyNumberStyle(event, 'lineHeight')} step="0.1" type="number" value={Number(props.snapshot.selection.activeObject?.get('lineHeight') ?? 1.2)} />
      </div>
      <div className="property-group">
        <label htmlFor="letterSpacing">Letter spacing</label>
        <input id="letterSpacing" min="0" onChange={(event) => applyNumberStyle(event, 'letterSpacing')} step="1" type="number" value={Number(props.snapshot.selection.activeObject?.get('charSpacing') ?? 0)} />
      </div>
      <div className="property-group">
        <label htmlFor="rotation">Rotation</label>
        <input id="rotation" onChange={(event) => applyNumberStyle(event, 'rotation')} step="1" type="number" value={Number(props.snapshot.selection.activeObject?.angle ?? 0)} />
      </div>
      <div className="inline-actions">
        <button onClick={() => props.actions?.applyTextStyle({ fontWeight: panelState.isBold ? 'normal' : 'bold' })} type="button">Bold</button>
        <button onClick={() => props.actions?.applyTextStyle({ fontStyle: panelState.isItalic ? 'normal' : 'italic' })} type="button">Italic</button>
        <button onClick={() => props.actions?.applyTextStyle({ underline: !panelState.isUnderline })} type="button">Underline</button>
        <button onClick={() => props.actions?.applyTextStyle({ strikethrough: !Boolean(props.snapshot.selection.activeObject?.get('linethrough')) })} type="button">Strike</button>
      </div>
      <div className="inline-actions">
        <button onClick={() => props.actions?.applyTextStyle({ align: 'left' })} type="button">Left</button>
        <button onClick={() => props.actions?.applyTextStyle({ align: 'center' })} type="button">Center</button>
        <button onClick={() => props.actions?.applyTextStyle({ align: 'right' })} type="button">Right</button>
        <button onClick={() => props.actions?.applyTextStyle({ align: 'justify' })} type="button">Justify</button>
      </div>
      <div className="inline-actions">
        <button onClick={() => props.actions?.applyTextStyle({ textTransform: 'uppercase' })} type="button">Upper</button>
        <button onClick={() => props.actions?.applyTextStyle({ textTransform: 'lowercase' })} type="button">Lower</button>
        <button onClick={() => props.actions?.applyObjectStyle({ lockAspectRatio: true })} type="button">Lock ratio</button>
        <button onClick={() => props.actions?.applyObjectStyle({ lockAspectRatio: false })} type="button">Unlock ratio</button>
      </div>
      <div className="inline-actions">
        <button onClick={() => props.actions?.bringToFront()} type="button">To front</button>
        <button onClick={() => props.actions?.sendToBack()} type="button">To back</button>
        <button onClick={() => props.actions?.bringForward()} type="button">Forward</button>
        <button onClick={() => props.actions?.sendBackward()} type="button">Back</button>
      </div>
      <div className="inline-actions">
        <button onClick={() => props.actions?.duplicateSelection()} type="button">Duplicate</button>
        <button onClick={() => props.actions?.lockSelection()} type="button">Lock</button>
        <button onClick={() => props.actions?.unlockSelection()} type="button">Unlock</button>
      </div>
      <button className="button-primary" onClick={() => props.actions?.removeBackgroundFromActiveImage()} type="button">Remove BG (API)</button>
    </aside>
  );
}

export default PropertiesPanel;
