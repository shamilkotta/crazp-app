#!/bin/sh
set -eu

# Trust the ephemeral intercept CA before dockerd starts so registry
# pulls/pushes work with interceptHttps.
if [ -f /etc/cloudflare/certs/cloudflare-containers-ca.crt ]; then
  cp /etc/cloudflare/certs/cloudflare-containers-ca.crt \
    /usr/local/share/ca-certificates/cloudflare-containers-ca.crt
  update-ca-certificates
fi

# Cloudflare Containers cannot manipulate iptables.
dockerd-entrypoint.sh dockerd --iptables=false --ip6tables=false &
until docker version >/dev/null 2>&1; do
  sleep 0.2
done
echo "Docker is ready"
wait
