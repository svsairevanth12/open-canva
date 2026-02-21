import {
  ChangeEvent,
  RefObject,
  useRef
} from 'react';

import type {
  CanvasActions,
  EditorStatus
} from '../../types/editor';

type ToolbarProps = {
  actions: CanvasActions | null;
  onStatusChange: (status: EditorStatus) => void;
};

function Toolbar(props: ToolbarProps): JSX.Element {
  /**
   * var: props
   * type: ToolbarProps
   * desc: Toolbar action providers and shared status update callback.
   */
  const imageInputRef: RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);
  const svgInputRef: RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);

  const runSyncAction = (action: () => void, successMessage: string): void => {
    /**
     * var: action
     * type: () => void
     * desc: Synchronous toolbar action callback.
     * var: successMessage
     * type: string
     * desc: Success state message displayed after action execution.
     */
    if (!props.actions) {
      return;
    }
    try {
      action();
      props.onStatusChange({
        message: successMessage,
        state: 'success'
      });
    } catch (error) {
      props.onStatusChange({
        message: error instanceof Error ? error.message : 'Action failed.',
        state: 'error'
      });
    }
  };

  const runAsyncAction = async (action: () => Promise<void>, loadingMessage: string, successMessage: string): Promise<void> => {
    /**
     * var: action
     * type: () => Promise<void>
     * desc: Asynchronous toolbar action callback.
     * var: loadingMessage
     * type: string
     * desc: Status message displayed while awaiting action completion.
     * var: successMessage
     * type: string
     * desc: Status message displayed after successful completion.
     */
    if (!props.actions) {
      return;
    }
    props.onStatusChange({
      message: loadingMessage,
      state: 'loading'
    });
    try {
      await action();
      props.onStatusChange({
        message: successMessage,
        state: 'success'
      });
    } catch (error) {
      props.onStatusChange({
        message: error instanceof Error ? error.message : 'Action failed.',
        state: 'error'
      });
    }
  };

  const handleImageInput = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: File input event containing uploaded image payload.
     */
    const file = event.target.files?.[0] ?? null;
    if (!file || !props.actions) {
      return;
    }
    await runAsyncAction(() => props.actions!.addImageFromFile(file), 'Adding image...', 'Image added.');
    event.target.value = '';
  };

  const handleSvgInput = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    /**
     * var: event
     * type: ChangeEvent<HTMLInputElement>
     * desc: File input event containing uploaded SVG payload.
     */
    const file = event.target.files?.[0] ?? null;
    if (!file || !props.actions) {
      return;
    }
    await runAsyncAction(() => props.actions!.importSvgFromFile(file), 'Importing SVG...', 'SVG imported.');
    event.target.value = '';
  };

  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <div className="brand-dot" />
        <strong>Open Canva</strong>
      </div>
      <div className="toolbar-grid">
        <button className="button-primary" onClick={() => svgInputRef.current?.click()} type="button">Upload SVG</button>
        <button onClick={() => runSyncAction(() => props.actions?.addText(), 'Text added.')} type="button">Text</button>
        <button onClick={() => runSyncAction(() => props.actions?.addRect(), 'Rectangle added.')} type="button">Rect</button>
        <button onClick={() => runSyncAction(() => props.actions?.addCircle(), 'Circle added.')} type="button">Circle</button>
        <button onClick={() => runSyncAction(() => props.actions?.addTriangle(), 'Triangle added.')} type="button">Triangle</button>
        <button onClick={() => imageInputRef.current?.click()} type="button">Image</button>
        <button onClick={() => runAsyncAction(() => props.actions?.exportSvg() ?? Promise.resolve(), 'Exporting SVG...', 'SVG exported.')} type="button">Export SVG</button>
        <button onClick={() => runAsyncAction(() => props.actions?.exportPng() ?? Promise.resolve(), 'Exporting PNG...', 'PNG exported.')} type="button">Export PNG</button>
        <button className="button-primary" onClick={() => runSyncAction(() => props.actions?.addRect(), 'New page layer added.')} type="button">Add Page</button>
      </div>
      <input accept=".svg,image/svg+xml" hidden onChange={handleSvgInput} ref={svgInputRef} type="file" />
      <input accept="image/*" hidden onChange={handleImageInput} ref={imageInputRef} type="file" />
    </header>
  );
}

export default Toolbar;
