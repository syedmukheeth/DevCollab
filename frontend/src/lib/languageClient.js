import { MonacoLanguageClient } from 'monaco-languageclient';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

let currentClient = null;
let currentSocket = null;

export const initLanguageClient = async (monaco, language) => {
  if (currentClient) {
    await currentClient.stop();
    currentClient = null;
  }
  if (currentSocket) {
    currentSocket.close();
    currentSocket = null;
  }

  // Only ts/js and python are supported in this demo MVP
  const supportedLangs = ['javascript', 'typescript', 'python'];
  if (!supportedLangs.includes(language)) return;

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const apiDomain = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || window.location.host;
  const wsUrl = `${protocol}://${apiDomain}/lsp/${language}`;

  const socket = new WebSocket(wsUrl);
  currentSocket = socket;

  socket.onopen = () => {
    const webSocket = toSocket(socket);
    const reader = new WebSocketMessageReader(webSocket);
    const writer = new WebSocketMessageWriter(webSocket);

    const languageClient = new MonacoLanguageClient({
      name: `DevCollab ${language.toUpperCase()} Client`,
      clientOptions: {
        documentSelector: [language]
      },
      connectionProvider: {
        get: () => Promise.resolve({ reader, writer })
      }
    });

    languageClient.start().then(() => {
      console.log(`LSP client for ${language} started.`);
    });
    currentClient = languageClient;
  };
};

export const stopLanguageClient = async () => {
  if (currentClient) {
    await currentClient.stop();
    currentClient = null;
  }
  if (currentSocket) {
    currentSocket.close();
    currentSocket = null;
  }
};
