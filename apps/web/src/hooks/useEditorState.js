import { useState } from 'react';

function useEditorState(initialValue) {
  const [state, setState] = useState(initialValue);
  return { state, setState };
}

export default useEditorState;
