#!/usr/bin/env bash
# Uploads web/ to the botsarewelcome subdomain (folder ~/botsarewelcome on the Simply web hosting).
# Needs the public key of ~/.ssh/bwl_deploy uploaded under "SSH Keys" in the control panel.
# No --delete: files that only exist on the server are left alone, and the config lives outside web/.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
key="${BWL_SSH_KEY:-$HOME/.ssh/bwl_deploy}"

rsync -avz -e "ssh -i ${key} -o IdentitiesOnly=yes" "${root}/web/" "villadsclaes.dk@ssh.simply.com:botsarewelcome/"
