# Rootless Docker-in-Docker so wrangler can build/push containers that crazp ships.
# https://developers.cloudflare.com/sandbox/guides/docker-in-docker/
ARG SANDBOX_VERSION=0.12.5
FROM docker.io/cloudflare/sandbox:${SANDBOX_VERSION}-musl AS sandbox-musl
FROM node:24-alpine AS node-runtime
FROM docker:28-dind-rootless

USER root

RUN apk add --no-cache \
    bash \
    ca-certificates \
    curl \
    file \
    fuse \
    git \
    libgcc \
    libstdc++ \
    s3fs-fuse \
    tar \
    unzip

RUN if [ -f /etc/fuse.conf ]; then \
      sed -i 's/#user_allow_other/user_allow_other/' /etc/fuse.conf; \
    else \
      echo user_allow_other > /etc/fuse.conf; \
    fi \
    && ln -sf /proc/mounts /etc/mtab

# musl sandbox binary is required on Alpine-based docker:dind-rootless
COPY --from=sandbox-musl /container-server/sandbox /sandbox
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules

RUN ln -sf ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -sf ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
 && ln -sf ../lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack

RUN npm install -g pnpm@10.33.4 wrangler@4.125.0

COPY boot-docker.sh /home/rootless/boot-docker.sh
RUN chmod +x /home/rootless/boot-docker.sh

# Wrangler only adds --network=host to docker build when this is set.
# Required because inner builds cannot use iptables-backed bridge networking.
ENV WRANGLER_CI_OVERRIDE_NETWORK_MODE_HOST=true

EXPOSE 8080

ENTRYPOINT ["/sandbox"]
CMD ["/home/rootless/boot-docker.sh"]
