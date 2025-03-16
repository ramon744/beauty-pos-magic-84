
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

try {
  createRoot(rootElement).render(<App />);
  console.log("Aplicação renderizada com sucesso");
} catch (error) {
  console.error("Erro ao renderizar a aplicação:", error);
  // Fallback para mostrar ao menos uma mensagem de erro para o usuário
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h2>Erro ao carregar a aplicação</h2>
      <p>Por favor, contate o suporte técnico.</p>
      <pre style="background: #f1f1f1; padding: 10px; text-align: left; margin-top: 20px;">${error?.message || 'Erro desconhecido'}</pre>
    </div>
  `;
}
