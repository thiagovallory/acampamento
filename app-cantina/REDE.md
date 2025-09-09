# Acesso pela Rede Local

## Como Executar

Para que outros dispositivos na mesma rede possam acessar o sistema:

1. Execute o comando de desenvolvimento:
   ```bash
   npm run dev
   ```

2. O sistema estará disponível em:
   - **Localmente**: http://localhost:5173/
   - **Na rede**: http://192.168.3.33:5173/ (ou o IP da sua máquina)

## Compartilhamento de Dados

Como os dados são armazenados localmente em cada dispositivo, use a função de **Sincronização** para compartilhar dados:

### Para Sincronizar Dados:

1. **No dispositivo principal** (com os dados):
   - Acesse o menu (⋮) > Sincronização
   - Clique em "Exportar Backup"
   - Salve o arquivo JSON

2. **No outro dispositivo**:
   - Acesse a mesma URL da rede
   - Vá em menu (⋮) > Sincronização
   - Clique em "Selecionar Arquivo" e escolha o backup
   - Os dados serão importados automaticamente

### Dicas Importantes:

- ⚠️ **A importação substitui todos os dados atuais**
- 🔄 **Sincronize regularmente** para manter os dispositivos atualizados
- 📱 **Funciona em qualquer dispositivo** (celular, tablet, computador) na mesma rede
- 💾 **Cada dispositivo mantém seus próprios dados** até ser sincronizado

## Solução de Problemas

### Página não carrega:
- Verifique se ambos dispositivos estão na mesma rede Wi-Fi
- Confirme se o servidor está rodando (`npm run dev`)
- Teste primeiro o acesso local: http://localhost:5173/

### Dados não aparecem:
- Isso é normal! Use a funcionalidade de Sincronização
- Exporte os dados do dispositivo principal
- Importe no dispositivo secundário

### Firewall/Antivírus:
- Pode bloquear o acesso pela rede
- Adicione exceção para o Node.js/Vite na porta 5173