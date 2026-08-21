# DEC Internal Pilot project account lock

This file records non-secret identity boundaries for `Internal-pilot-dashboard`. It contains no credentials.

## Required project identity

- Primary project email: `tbeyene972@gmail.com`
- Local workspace: `D:\Internal-pilot-dashboard`
- Supabase project ref: `xkmkowmigupwotuphels`
- Supabase project URL: `https://xkmkowmigupwotuphels.supabase.co`
- GitHub owner/account: `Girum-Beyene`
- GitHub repository: `Girum-Beyene/Internal-pilot-dashboard-`
- GitHub repository URL: `https://github.com/Girum-Beyene/Internal-pilot-dashboard-`
- Required Git remote: `https://github.com/Girum-Beyene/Internal-pilot-dashboard-.git`
- Required project Git email: `tbeyene972@gmail.com`
- Vercel username/account: `tbeyene972-6860`
- Vercel team: `internal-pilot-dashboard`
- Vercel-associated email: `tbeyene972@gmail.com`

## Mandatory pre-action checks

Before any Supabase, GitHub, Vercel, browser-authenticated, or deployment action, verify the visible/configured target and authenticated account. Continue only if it matches this file exactly. If it differs or cannot be verified, stop and request human authentication or account switching. If sign-in is required, navigate only to the legitimate service sign-in page and ask the user to take over. Never request passwords, API keys, database URLs, or service-role keys in chat.

Before any GitHub initialization, remote configuration, branch creation, push, pull request, or repository action:

1. Inspect repository state and `git remote -v`.
2. Inspect the authenticated GitHub identity when available.
3. Require account `Girum-Beyene`.
4. Require `origin` to point only to `Girum-Beyene/Internal-pilot-dashboard-`.
5. Stop on any mismatch or unverifiable identity.

Before any Vercel link, project creation, environment-variable change, production deployment, or domain assignment:

1. Verify account `tbeyene972-6860`.
2. Verify/select team `internal-pilot-dashboard`.
3. Verify that the intended Vercel project belongs to that team.
4. Stop on any mismatch or unverifiable identity.

Do not use credentials, accounts, organizations, teams, repositories, Supabase projects or Vercel projects inherited from other DEC/CSO Learning Hub work. This project has its own account boundary.

## Secret handling

Real environment files and service credentials remain local and untracked. Never display, log, copy into documentation, or commit their values. `NEXT_PUBLIC_DATA_MODE` remains `sample` until the live activation gate is explicitly cleared.
