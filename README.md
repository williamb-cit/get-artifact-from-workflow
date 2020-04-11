# Get Artifact from Workflow

## Sobre

Obtém um artefato da execução de outro workflow e extrai seu conteúdo num diretório de distribuição do workflow usando a *action*. Os workflows envolvidos no processo são:

- **Outro workflow:** responsável pela criação e upload do artefato
- **Workflow usando a *action*:** responsável por obter o artefato e utilizar o arquivo de distribuição contido nele

A relação entre os workflows é estabelecida por meio do ID do commit (`GITHUB_SHA`). Sendo assim, **o commit que disparou o outro workflow também deve ser responsável por disparar o workflow usando a *action***.

## Entradas

|Nome|Obrigatório|Descrição|Padrão|
|-|-|-|-|
|`artifact_name`|N|Nome do artefato que foi registrado (upload) no outro workflow|`distro-${{ github.sha }}`|
|`target_path`|N|Diretório onde serão armazenados os arquivos contidos no artefato|`${{ github.workspace }}`|
|`token`|S|Use `${{ secrets.GITHUB_TOKEN }}`|-|
|`workflow_id`|S|Nome do arquivo que define o *outro workflow*|-|

## Saídas

|Nome|Descrição|
|-|-|
|`distro_content_path`|Diretório onde foram extraídos os arquivos contidos no artefato (`distro-${{ github.sha }}`)|

## Exemplos

### Simples

```yaml
uses: williamb-cit/get-artifact-from-workflow@v1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  workflow_id: another-workflow-file.yml
```

### Completo

```yaml
uses: williamb-cit/get-artifact-from-workflow@v1
with:
  artifact_name: newrelease
  target_path: ./custom-target-path
  token: ${{ secrets.GITHUB_TOKEN }}
  workflow_id: another-workflow-file.yml
```

## Desenvolvimento

### Testando a *action*

Esta *action* pode ser executada localmente, mas é necessário configurar as variáveis de ambiente para simular o uso dentro de um workflow do GitHub Actions.

Primeiro, crie o arquivo `.env` e adicione o seguinte conteúdo:

```
GITHUB_REPOSITORY=<OWNER>/<REPO_NAME>
GITHUB_SHA=<COMMIT_ID>
GITHUB_WORKSPACE=<PATH_TO_SIMULATE_GITHUB_WORKSPACE>
INPUT_ARTIFACT_NAME=<NAME>
INPUT_TARGET_PATH=<PATH>
INPUT_TOKEN=<GITHUB_TOKEN>
INPUT_WORKFLOW_ID=<WORKFLOW_FILE_NAME>
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

O arquivo `dist/index.js` será atualizado e pode ser versionado. A execução do script compilado pode ser testado usando o seguinte comando:

```
npm run dist
```

Visto que `dist/index.js` é o arquivo executado pela *action* durante a execução do workflow, é importante testá-lo antes de publicar uma atualização, garantindo assim que ele contém os novos comportamentos e lógicas implementadas.
