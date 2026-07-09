import { hasShellHostInvoke, startWindowDrag } from './index.js';

export async function startStudioWindowDrag(): Promise<void> {
  if (!hasShellHostInvoke()) {
    return;
  }
  try {
    await startWindowDrag();
  } catch {
    // Dragging is best-effort and must not break interaction.
  }
}
