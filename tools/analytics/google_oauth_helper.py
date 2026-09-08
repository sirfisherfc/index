#!/usr/bin/env python3
"""Gera a URL OAuth do Google Business Profile sem gravar credenciais no Git.

Defina localmente GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_REDIRECT_URI antes de
executar. O segredo OAuth nunca e necessario para gerar a URL de autorizacao e
nao deve ser incluido em arquivos versionados.
"""

from __future__ import annotations

import os
from urllib.parse import urlencode


AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
SCOPES = (
    "https://www.googleapis.com/auth/business.manage",
)


def configuracao_local() -> tuple[str, str]:
    client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "").strip()
    redirect_uri = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI", "").strip()
    if not client_id or not redirect_uri:
        raise SystemExit(
            "Defina GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_REDIRECT_URI no ambiente local."
        )
    return client_id, redirect_uri


def main() -> int:
    client_id, redirect_uri = configuracao_local()
    parametros = urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "scope": " ".join(SCOPES),
        }
    )
    print(f"{AUTHORIZATION_ENDPOINT}?{parametros}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
