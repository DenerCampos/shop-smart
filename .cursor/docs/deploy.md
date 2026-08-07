# Deploy (VPS / CI)

## Objetivo

Automatizar backup, pull, build Docker, subida dos containers, migrations e limpeza de imagens antigas na VPS de produção.

## Escopo

- **Entra:** `deploy.sh` (manual/interativo) e `ci_deploy.sh` (GitHub Actions via SSH).
- **Fora:** build/push de imagem para registry remoto; deploy do app front (Netlify).

## Fluxo

1. Status dos containers
2. Backup do banco (`docker compose run … backup`)
3. `git fetch` / `git pull origin main`
4. Detecção de mudanças (`package.json`, migrations, `Dockerfile`)
5. `down` → build da API → `up -d`
6. Health check da API (até ~60s)
7. Migrations em produção se houver diff em `db/migrations/`
8. Logs + `ps`
9. **`docker image prune -af`** — remove imagens não referenciadas por nenhum container
10. Resumo de sucesso

O prune roda **somente depois** dos containers estarem no ar (e após migrations, se aplicável). Falha no prune **não** aborta o deploy.

## Contratos

| Script | Quando |
|--------|--------|
| [`deploy.sh`](../../deploy.sh) | SSH manual na VPS |
| [`ci_deploy.sh`](../../ci_deploy.sh) | Workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) após push em `main` |

## Regras de negócio

- Imagens em uso pelos containers atuais **não** são removidas (`prune` só remove não usadas).
- `-a`: todas as imagens não usadas (não só dangling); `-f`: sem prompt (obrigatório no CI).
- Em CI, falha de backup aborta; no `deploy.sh` o operador pode optar por continuar.
- **Rollback:** após o prune, a imagem da versão anterior deixa de existir no host. Rollback imediato por retag da imagem antiga **não** está disponível; use o commit anterior (`git checkout` / revert) + rebuild (`./deploy.sh` ou novo deploy via CI).

## Arquivos-chave

- `deploy.sh`, `ci_deploy.sh`
- `docker-compose.yml`, `Dockerfile`
- `.github/workflows/deploy.yml`

## Testes

Não há suite automatizada dos scripts shell. Validar na VPS (ou staging):

```bash
# após um deploy bem-sucedido, conferir que o passo de prune apareceu no log
./deploy.sh
# ou via CI: logs do job Deploy / saída do ci_deploy.sh

docker images
docker ps
```
