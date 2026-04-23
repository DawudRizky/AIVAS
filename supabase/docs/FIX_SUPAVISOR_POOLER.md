**Fix: supabase-pooler (supavisor) restarts with Elixir SyntaxError: unexpected token: carriage return**

- **Symptom:** `supabase-pooler` (container `supabase-pooler`) repeatedly restarts with logs showing:
  - `** (SyntaxError) invalid syntax found on nofile:30:4: error: unexpected token: carriage return (column 4, code point U+000D)`

- **Root cause (concise):** A file mounted into the pooler process (typically `volumes/pooler/pooler.exs`) contains Windows CRLF line endings. Elixir evaluates the file and sees `\r` (carriage return) characters, causing a syntax error. This is analogous to the shebang/CRLF issue for shell scripts: CRLF injects `\r` into parsing and breaks interpreters.

Diagnosis steps (what you ran)

1) Inspect container logs to read the exact error (shows `nofile:30:4` and `U+000D`):

```powershell
docker logs --timestamps --tail=200 supabase-pooler
```

2) Recreate the pooler service in the foreground to reproduce startup output interactively:

```powershell
docker compose up --force-recreate --no-deps supavisor
```

3) Check the mounted config inside a throwaway container to see `^M` markers (CR):

```powershell
docker run --rm -v "${PWD}/volumes/pooler/pooler.exs:/tmp/pooler.exs:ro" alpine cat -v /tmp/pooler.exs
```

4) Confirm the host copy has CRLF:

```powershell
(Get-Content .\volumes\pooler\pooler.exs -Raw) -match "`r`n"
```
- `True` indicates CRLF present.

Fix steps (apply in this order)

1) Backup the original file (keep the `.bak` for reference):

```powershell
Copy-Item .\volumes\pooler\pooler.exs .\volumes\pooler\pooler.exs.bak
```

2) Convert CRLF -> LF on the host (PowerShell):

```powershell
(Get-Content .\volumes\pooler\pooler.exs -Raw) -replace "`r`n","`n" | Set-Content .\volumes\pooler\pooler.exs -NoNewline
```

3) Remove Linux/SELinux `:z` mount option in `docker-compose.yml` for the pooler bind if present (Windows hosts):

- Change:
```
- ./volumes/pooler/pooler.exs:/etc/pooler/pooler.exs:ro,z
```
- To:
```
- ./volumes/pooler/pooler.exs:/etc/pooler/pooler.exs:ro
```

4) Recreate the pooler container so Docker picks up the fixed file:

```powershell
docker compose up --force-recreate --no-deps supavisor
# or to restart all services:
docker compose up -d
```

Verification

- Confirm the container starts without the carriage-return syntax error:

```powershell
docker logs --timestamps --tail=200 supabase-pooler
```

- Confirm the mounted file inside a container shows no `^M` markers:

```powershell
docker run --rm -v "${PWD}/volumes/pooler/pooler.exs:/tmp/pooler.exs:ro" alpine cat -v /tmp/pooler.exs
# no ^M should appear
```

- Confirm the container is `Up` and healthy:

```powershell
docker compose ps
```

Why this fixes the problem (technical detail)

- Elixir (and many interpreters) will parse strings and source files literally. If a file contains CR (`\r`) characters at line ends, the parser may treat `\r` as an unexpected token. Removing CR (`\r`) by converting to LF-only removes the unexpected token and allows the file to be parsed.

Extra troubleshooting notes

- If the pooled config still errors after conversion, double-check other files mounted into the pooler (any `.exs`, `.ex`, or scripts) for CRLF.
- Use `Get-FileHash` or `fc /b` to confirm the `.exs` backup and current file differ:

```powershell
Get-FileHash .\volumes\pooler\pooler.exs
Get-FileHash .\volumes\pooler\pooler.exs.bak
```

- If file permissions or executable flags matter inside the image, test the file contents in a temp container (the `alpine cat -v` check is the simplest and most deterministic).

Files created/modified during the fix

- `volumes/pooler/pooler.exs.bak` — backup of original CRLF file
- `volumes/pooler/pooler.exs` — converted to LF-only
- `docker-compose.yml` — edit suggested (remove `:z` suffix on the pooler mount) if present

If you want, I can:
- commit the new `docs/FIX_SUPAVISOR_POOLER.md` to a branch, or
- add a small PowerShell script under `utils/` to detect and convert CRLF -> LF for all files in `volumes/` automatically.

---
Document created at `docs/FIX_SUPAVISOR_POOLER.md` in the repository.