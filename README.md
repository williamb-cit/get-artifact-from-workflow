# Get Artifact from Workflow

## Sobre

Obtém um artefato da execução de outro workflow e extrai o **arquivo de distribuição**. O arquivo de distribuição deve ser um tarball (`.tar.gz`) com o nome igual ao ID do commit (`GITHUB_SHA`) que disparou o outro workflow.

A relação entre o workflow que usa esta *action* e o outro workflow é estabelecida por meio do ID do commit que disparou o outro workflow, logo ele também deve disparar workflow usando a *action*.

Para deixar claro os workflows envolvidos no processo:

- **Outro workflow:** responsável pela criação do pacote e registro do artefato
- **Workflow usando a *action*:** responsável por obter o artefato e utilizar o arquivo de distribuição contido nele

## Entradas

- **(Opcional)** `artifact-name`: Nome do artefato que foi registrado (upload) no outro workflow. Padrão: "distro"
- **(Obrigatório)** `token`: `${{ secrets.GITHUB_TOKEN }}`
- **(Obrigatório)** `workflow-id`: Nome do arquivo que define o *outro workflow*

## Saídas

- `distro-file-name`: Nome do arquivo de distribuição (idêntico a usar `${{ github.sha }}.tar.gz`)

## Exemplo

```yaml
uses: williamb-cit/get-artifact-from-workflow@v1
with:
  artifact-name: newrelease
  token: ${{ secrets.GITHUB_TOKEN }}
  workflow-id: another-workflow.yml
```
