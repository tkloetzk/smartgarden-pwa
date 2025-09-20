import { setupServer } from "msw/node";
import { handlers, setMockData as setHandlersMockData, clearMockData as clearHandlersMockData } from "./handlers";

// Setup MSW server with our handlers
export const server = setupServer(...handlers);

// Re-export mock utilities from handlers
export const setMockData = setHandlersMockData;
export const clearMockData = clearHandlersMockData;