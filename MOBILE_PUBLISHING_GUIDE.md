# Guia de Publicação Mobile (Google Play & Apple App Store) — BioForma

Este projeto agora está totalmente adaptado e preparado para ser empacotado como aplicativo nativo para **Android** e **iOS** utilizando o **Capacitor** (tecnologia recomendada pela indústria para empacotar apps modernos desenvolvidos com React/Vite de forma extremamente rápida e de alto desempenho).

Aqui está o passo a passo completo para você buildar, testar e publicar o **BioForma** nas lojas oficiais de aplicativos!

---

## 🚀 1. Estrutura do Projeto

*   **`/android`**: Pasta contendo o projeto nativo do Android Studio.
*   **`/ios`**: Pasta contendo o projeto nativo do Xcode.
*   **`capacitor.config.ts`**: Configuração global do Capacitor vinculando o app ao ID único `com.bioforma.app`.

---

## 🛠️ 2. Pré-requisitos do Ambiente

Para compilar e gerar os instaladores finais, você precisará instalar em sua máquina local:

1.  **Node.js** (versão 18 ou superior).
2.  **Para Android**: [Android Studio](https://developer.android.com/studio) + SDK do Android configurado.
3.  **Para iOS**: Computador macOS com [Xcode](https://developer.apple.com/xcode/) instalado.

---

## 💻 3. Fluxo de Desenvolvimento e Sincronização

Sempre que você fizer qualquer alteração no código do React (pasta `src`), siga este fluxo simples para atualizar os apps nativos:

### Passo 1: Compilar o código Web (React/Vite)
Isso gera a versão otimizada na pasta `/dist`:
```bash
npm run build
```

### Passo 2: Sincronizar com os Projetos Nativos
Isso copia os arquivos atualizados da pasta `/dist` para dentro das estruturas do Android e iOS e atualiza possíveis plugins adicionados:
```bash
npm run cap:sync
```

> 💡 **Dica de Atalho**: Criamos o comando `npm run build:mobile` que faz os dois passos acima de uma só vez!
> ```bash
> npm run build:mobile
> ```

---

## 🎨 4. Geração Automática de Ícones e Telas de Splash

Para que o aplicativo não tenha ícones padrão do Capacitor, você pode gerar todos os tamanhos requeridos pela Google e Apple automaticamente.

1. Crie uma pasta chamada `assets` na raiz do projeto (se não existir).
2. Adicione lá três arquivos base de alta resolução:
   *   `assets/icon-only.png` (Ícone limpo, idealmente 1024x1024px, sem transparência para iOS).
   *   `assets/icon-foreground.png` (Para ícone adaptativo do Android, opcional).
   *   `assets/icon-background.png` (Para ícone adaptativo do Android, opcional).
   *   `assets/splash.png` (Imagem da tela de abertura, idealmente 2732x2732px).
3. Execute o script automatizado que instalamos para você:
```bash
npm run cap:assets
```
Este comando gerará e substituirá automaticamente todos os ícones e telas de abertura nas pastas de recurso nativas do Android e iOS.

---

## 🤖 5. Publicando na Google Play Store (Android)

### Passo 1: Abrir o projeto no Android Studio
Execute na raiz do projeto:
```bash
npm run cap:open:android
```
O Android Studio abrirá automaticamente a pasta `/android`. Aguarde a indexação inicial do Gradle ser concluída.

### Passo 2: Alterar versão do app
No painel esquerdo, navegue até `Gradle Scripts` -> `build.gradle (Module :app)` e configure:
*   `versionCode`: Um número inteiro que deve subir a cada atualização (ex: `1`, `2`, `3`).
*   `versionName`: A versão visível ao usuário (ex: `"1.0.0"`).

### Passo 3: Gerar o pacote de produção (AAB)
O Google Play agora exige o formato `.aab` (Android App Bundle) em vez de `.apk` para novos aplicativos.
1. No menu superior do Android Studio, vá em: **Build** -> **Generate Signed Bundle / APK...**
2. Escolha **Android App Bundle** e clique em **Next**.
3. Em **Key store path**, se você não tiver uma chave de assinatura, clique em **Create new...** e preencha o formulário para salvar sua chave `.jks` com segurança (guarde muito bem essa senha, você precisará dela para enviar atualizações do app).
4. Insira os dados da chave criada e marque "Remember passwords". Clique em **Next**.
5. Selecione a variante **release** e clique em **Create**.
6. O Android Studio compilará o aplicativo e exibirá uma notificação no canto inferior direito informando que o arquivo `.aab` está pronto. Clique em **Locate** para abrir a pasta do arquivo compilado.

### Passo 4: Enviar ao Google Play Console
1. Acesse o [Google Play Console](https://play.google.com/console/) com sua conta de desenvolvedor.
2. Clique em **Criar app** e preencha as informações básicas.
3. No menu lateral, vá em **Produção** -> **Criar nova versão**.
4. Faça o upload do arquivo `.aab` gerado no Passo 3.
5. Preencha as notas de lançamento, configure a política de privacidade e envie para a revisão do Google!

---

## 🍎 6. Publicando na Apple App Store (iOS)

### Passo 1: Abrir o projeto no Xcode
Execute na raiz do projeto (no seu macOS):
```bash
npm run cap:open:ios
```
O Xcode abrirá automaticamente o projeto contido na pasta `/ios`.

### Passo 2: Configurar o Assinador (Signing) e Bundle ID
1. No painel esquerdo do Xcode, clique no nó raiz azul **App**.
2. Na aba principal, vá para **Signing & Capabilities**.
3. Em **Team**, selecione sua conta de desenvolvedor da Apple (Apple Developer Account).
4. Verifique se o **Bundle Identifier** está definido como `com.bioforma.app`.

### Passo 3: Definir Versão e Build
Na aba **General**:
*   **Version**: Versão pública (ex: `1.0.0`).
*   **Build**: Número incremental interno da versão (ex: `1`, `2`).

### Passo 4: Arquivar e Enviar (Archive)
1. No menu superior, mude o dispositivo de simulação para **Any iOS Device (arm64)**.
2. Vá em: **Product** -> **Archive**.
3. O Xcode compilará todo o projeto. Ao terminar, abrirá a janela do Organizador (Organizer).
4. Selecione a build recente e clique em **Distribute App**.
5. Selecione **App Store Connect** e siga o assistente automático clicando em *Next* para fazer o upload do aplicativo diretamente para a sua conta da Apple.

### Passo 5: Finalizar no App Store Connect
1. Acesse o [App Store Connect](https://appstoreconnect.apple.com/).
2. Adicione sua nova versão do **BioForma**, selecione a build enviada pelo Xcode, preencha as capturas de tela e envie para a revisão da Apple.

---

## 🎯 7. Dicas de Otimização e Mobile UX

*   **Suporte a Touch Completo**: O app já foi estruturado com feedbacks táteis excelentes e layouts flexíveis que respondem muito bem ao toque.
*   **Segurança de Conexão (HTTPS)**: O Capacitor força conexões seguras por padrão. Todas as requisições à API do Firebase funcionarão de maneira transparente e nativa nos celulares de seus usuários.
*   **Performance Excepcional**: Graças ao empacotamento estático do Vite, os arquivos já carregam localmente no dispositivo em microssegundos, resultando em uma velocidade muito superior à de sites comuns.

*Boa sorte no lançamento do BioForma nas lojas oficiais!*
