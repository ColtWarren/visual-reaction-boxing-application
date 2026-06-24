// frontend/src/hooks/useInputHandler.ts (deprecated)
// Implementation moved to useReactionInput.ts (Step 12, R71.5 P4 mechanical
// move). This file is a compatibility re-export shim so legacy imports of
// `useInputHandler` continue to resolve. Step 13 may remove it after all
// callers have migrated to useReactionInput directly.
export { useReactionInput as useInputHandler } from './useReactionInput';
