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

  const handleFill = (event: ChangeEvent<HTMLInputElement>): void => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: Color input event used to update active object fill.
     */
    props.actions?.applyObjectStyle({
      fill: event.target.value
    });
  };

  const handleOpacity = (event: ChangeEvent<HTMLInputElement>): void => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: Range input event used to set active object opacity.
     */
    props.actions?.applyObjectStyle({
      opacity: Number(event.target.value)
    });
  };

  const handleFontSize = (event: ChangeEvent<HTMLInputElement>): void => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: Number input event used to change active text font size.
     */
    props.actions?.applyTextStyle({
      fontSize: Number(event.target.value)
    });
  };

  const handleFontFamily = (event: ChangeEvent<HTMLSelectElement>): void => {
    /**
     * var: event
     * type: ChangeEvent<HTMLSelectElement>
     * desc: Select input event used to set active text font family.
     */
    props.actions?.applyTextStyle({
      fontFamily: event.target.value
    });
  };

  return (
    <aside className="properties-panel">
      <h3>Design Controls</h3>
      <div className="property-group">
        <label htmlFor="fillColor">Fill</label>
        <input id="fillColor" onChange={handleFill} type="color" value={panelState.fill} />
      </div>
      <div className="property-group">
        <label htmlFor="opacityRange">Opacity</label>
        <input id="opacityRange" max="1" min="0.1" onChange={handleOpacity} step="0.05" type="range" value={panelState.opacity} />
      </div>
      <div className="property-group">
        <label htmlFor="fontFamily">Font</label>
        <select id="fontFamily" onChange={handleFontFamily} value={panelState.fontFamily}>
          <option value="Open Sans">Open Sans</option>
          <option value="Poppins">Poppins</option>
          <option value="Inter">Inter</option>
          <option value="Montserrat">Montserrat</option>
        </select>
      </div>
      <div className="property-group">
        <label htmlFor="fontSize">Font size</label>
        <input id="fontSize" min="8" onChange={handleFontSize} type="number" value={panelState.fontSize} />
      </div>
      <div className="inline-actions">
        <button onClick={() => props.actions?.applyTextStyle({ fontWeight: panelState.isBold ? 'normal' : 'bold' })} type="button">Bold</button>
        <button onClick={() => props.actions?.applyTextStyle({ fontStyle: panelState.isItalic ? 'normal' : 'italic' })} type="button">Italic</button>
        <button onClick={() => props.actions?.applyTextStyle({ underline: !panelState.isUnderline })} type="button">Underline</button>
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
      <button className="button-primary" onClick={() => props.actions?.removeBackgroundFromActiveImage()} type="button">Remove BG (quick)</button>
      <h3>Layers</h3>
      <div className="layers-list">
        {props.snapshot.layers.map((layer) => (
          <div className="layer-item" key={layer.id}>
            <span>{layer.label}</span>
            <span>{layer.isLocked ? '🔒' : '🔓'}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default PropertiesPanel;
