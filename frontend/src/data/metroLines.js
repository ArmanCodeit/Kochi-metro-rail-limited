// Kochi Metro Lines dataset - backed by verified multi-line network architecture
import { getFullLines } from './metroNetworkData';

const fullLines = getFullLines();

// Exported for backwards-compatibility with existing components (Chatbot, LiveService, Dashboard)
const metroLines = fullLines.map(line => ({
  ...line,
  // Add legacy alias support: 'line-1' for Blue Line, 'line-2' for Pink Line
  legacyId: line.id === 'line-blue' ? 'line-1' : (line.id === 'line-pink' ? 'line-2' : line.id)
}));

export default metroLines;
export { metroLines };
