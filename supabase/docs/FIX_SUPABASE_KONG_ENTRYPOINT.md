**Fix: supabase-kong fails with "exec /home/kong/kong-entrypoint.sh: no such file or directory"**

- **Symptom:** `supabase-kong` container restarts with error `exec /home/kong/kong-entrypoint.sh: no such file or directory` and `docker inspect` shows the container health is `unhealthy` or `restarting`.

- **Root cause (concise):** The mounted `kong-entrypoint.sh` file used Windows CRLF (\r\n) line endings. The Linux kernel interprets the shebang (e.g., `#!/bin/bash\r`) as a path with an extra `\r`, so it tries to exec `/bin/bash\r` which does not exist -> ENOENT. Additionally, compose mount options used on Windows may have included `:z` (SELinux label) which is not appropriate on Windows; removing it avoids mount mode surprises.

Steps taken to diagnose and fix

1) Verify symptom and container state

```powershell
docker compose ps
# find the kong container name (supabase-kong)

docker inspect supabase-kong --format '{{json .State}}' | ConvertFrom-Json
```

2) Confirm the mounted file inside a container (shows `^M` if CR present)

```powershell
# from repo root
docker run --rm -v "${PWD}/volumes/api/kong-entrypoint.sh:/tmp/kong-entrypoint.sh:ro" alpine cat -v /tmp/kong-entrypoint.sh
```

- Output showing `^M` at line ends (for example `#!/bin/bash^M`) indicates CRLF present inside the bind mount.

3) Check line endings on host (PowerShell)

```powershell
(Get-Content .\volumes\api\kong-entrypoint.sh -Raw) -match "`r`n"
(Get-Content .\volumes\api\kong-entrypoint.sh.bak -Raw) -match "`r`n"
```

- `True` = CRLF present; `False` = LF-only.

4) Backup the original file and convert to Unix LF (PowerShell)

```powershell
Copy-Item .\volumes\api\kong-entrypoint.sh .\volumes\api\kong-entrypoint.sh.bak
# Convert CRLF -> LF
(Get-Content .\volumes\api\kong-entrypoint.sh -Raw) -replace "`r`n","`n" | Set-Content .\volumes\api\kong-entrypoint.sh -NoNewline
```

5) Remove incompatible `:z` mount option (Windows) in `docker-compose.yml`

- Edit the `kong` service volumes and change lines like:
  - `- ./volumes/api/kong.yml:/home/kong/temp.yml:ro,z`
  - `- ./volumes/api/kong-entrypoint.sh:/home/kong/kong-entrypoint.sh:ro,z`

  to:

  - `- ./volumes/api/kong.yml:/home/kong/temp.yml:ro`
  - `- ./volumes/api/kong-entrypoint.sh:/home/kong/kong-entrypoint.sh:ro`

6) Recreate/restart only the Kong service to pick up corrected file and mounts

```powershell
# recreate just the kong service without dependencies
docker compose up --force-recreate --no-deps kong
# Or run full compose
docker compose up -d
```

7) Verify Kong is healthy

```powershell
docker compose ps
docker compose logs --tail=200 --timestamps supabase-kong
docker inspect supabase-kong --format '{{json .State}}' | ConvertFrom-Json
```

Verification commands (optional, more assurance)

- Show the file inside a temporary container again (should show no `^M`):

```powershell
docker run --rm -v "${PWD}/volumes/api/kong-entrypoint.sh:/tmp/kong-entrypoint.sh:ro" alpine cat -v /tmp/kong-entrypoint.sh
```

- Confirm bind mounts in the running container:

```powershell
docker inspect supabase-kong --format '{{json .Mounts}}'
```

- Compare binary hashes of original backup vs current file to show they differ:

```powershell
Get-FileHash .\volumes\api\kong-entrypoint.sh
Get-FileHash .\volumes\api\kong-entrypoint.sh.bak
```

- On Windows (cmd) a binary compare:

```cmd
fc /b volumes\api\kong-entrypoint.sh volumes\api\kong-entrypoint.sh.bak
```

Why this fixes the problem (technical detail)

- The kernel reads the first line of an interpreted script to find the interpreter path (the shebang). If the script's line endings include `\r`, the kernel uses that `\r` as part of the interpreter path. `/bin/bash\r` does not exist, so exec fails with `no such file or directory` even though `/bin/bash` exists. Removing CR from line endings makes the shebang valid.

- The `:z` SELinux mount option is meaningful on Linux hosts with SELinux; on Windows it can be ignored or cause Docker Desktop to represent the mount mode differently. Removing it clarifies the mount mode to just `ro` and avoids surprises.

Extra troubleshooting notes

- If you still see `no such file` after conversion, double-check you mounted the *file* (bind) and not a directory over `/home/kong` (which would hide the image's expected files).
- If the file exists but it's not executable because of permissions, either ensure the container image entrypoint can run it (`exec /bin/sh` style) or set permissions by running a short container that `chmod +x` on the mount (note: some bind mounts reflect host NTFS permissions differently).
- If you prefer not to mount the custom entrypoint during local Windows dev, remove the volume bind so the image's built-in entrypoint is used.

Files created/modified during the fix

- `volumes/api/kong-entrypoint.sh.bak` — backup copy (original CRLF file)
- `volumes/api/kong-entrypoint.sh` — converted to LF-only
- `docker-compose.yml` — `:z` flags removed from Kong binds (edit performed manually)

References and links

- Explanation of CRLF shebang issue: common Linux shebang + CRLF problem (search "shebang CRLF no such file or directory").
- Docker bind mount notes: avoid Linux-specific mount options on Windows.

If you want I can:
- Create a small automated script to detect and fix CRLF entrypoint issues across the repo, or
- Commit the `docker-compose.yml` change and the backup files to a branch for record-keeping.

---
Document created at `docs/FIX_SUPABASE_KONG_ENTRYPOINT.md` in the repository.