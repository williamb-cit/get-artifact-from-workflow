# Get Artifact from Workflow

## Sobre

Obtém um artefato da execução de outro workflow e extrai o **arquivo de distribuição**. O arquivo de distribuição deve ser um tarball (`.tar.gz`) com o nome igual ao ID do commit (`GITHUB_SHA`) que disparou o outro workflow.

A relação entre o workflow que usa esta *action* e o outro workflow é estabelecida por meio do ID do commit que disparou o outro workflow, logo ele também deve disparar workflow usando a *action*.

Para deixar claro os workflows envolvidos no processo:

- **Outro workflow:** responsável pela criação do pacote e registro do artefato
- **Workflow usando a *action*:** responsável por obter o artefato e utilizar o arquivo de distribuição contido nele

## Entradas

- **(Opcional)** `artifact-name`: Nome do artefato que foi registrado (upload) no outro workflow. Padrão: "distro-${{ GITHUB_SHA }}"
- **(Opcional)** `target-path`: Diretório onde serão armazenados os arquivos contidos no artefato. Padrão: `GITHUB_WORKSPACE`
- **(Obrigatório)** `token`: `${{ secrets.GITHUB_TOKEN }}`
- **(Obrigatório)** `workflow-id`: Nome do arquivo que define o *outro workflow*

## Saídas

- `distro-file-name`: Nome do arquivo de distribuição (idêntico a usar `${{ github.sha }}.tar.gz`)

## Exemplos

### Simples

```yaml
uses: williamb-cit/get-artifact-from-workflow@v1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  workflow-id: another-workflow-file.yml
```

### Completo

```yaml
uses: williamb-cit/get-artifact-from-workflow@v1
with:
  artifact-name: newrelease
  target-path: ./custom-target-path
  token: ${{ secrets.GITHUB_TOKEN }}
  workflow-id: another-workflow-file.yml
```

## Desenvolvimento

### Testando a action

Esta *action* pode ser executada localmente, mas é necessário configurar as variáveis de ambiente para simular o uso dentro de um workflow do GitHub Actions.

Primeiro, crie um arquivo `.env` e adicione o seguinte conteúdo:

```
GITHUB_REPOSITORY=<OWNER>/<REPO_NAME>
GITHUB_SHA=<COMMIT_ID>
GITHUB_WORKSPACE=<PATH_TO_SIMULATE_GITHUB_WORKSPACE>
INPUT_ARTIFACT-NAME=<NAME>
INPUT_TARGET-PATH=<PATH>
INPUT_TOKEN=<GITHUB_TOKEN>
INPUT_WORKFLOW-ID=<WORKFLOW_FILE_NAME>
OCTOKIT_LOG_REQUESTS=true
```

Após preencher as variáveis com o valor correto, execute:

```
npm run local
```

**ATENÇÃO: Nunca versione o arquivo `.env`!**

### Publicando atualizações

Para gerar o arquivo de distribuição desta *action*, execute o seguinte comando:

```
npm run build
```

O arquivo `dist/index.js` será atualizado e pode ser versionado.
