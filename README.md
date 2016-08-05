Stands up a [Ghost](https://ghost.org/) blog along with [PostgreSQL](https://www.postgresql.org/).
Both will have data mounted locally (i.e. outside of their containers).

# Ok, another blog, so what!?

The real kicker here though is [Vault](https://www.vaultproject.io/).

PostgreSQL credentials are securely written to Vault, and passed on to the docker container via a temporary Vault token (i.e. [Response Wrapping](https://www.vaultproject.io/docs/secrets/cubbyhole/index.html#response-wrapping))

# Show me

## Starting Vault

```bash
docker run --name=dev-vault -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' -p 8200:8200 -d vault
```

```bash
docker logs dev-vault
```

```bash
...
The only step you need to take is to set the following
environment variables:

    export VAULT_ADDR='http://0.0.0.0:8200'

The unseal key and root token are reproduced below in case you
want to seal/unseal the Vault or play with authentication.

Unseal Key: 119ce7aa59eea1d892fbaaf6d99120edeff184690655e2ef583381f85e0a0323
Root Token: 75de9b20-16fa-5a1e-2e9a-39c86caef504
...
```

we would need 2 pieces of data from the above, a root token and a host address:

```bash
export VAULT_TOKEN=75de9b20-16fa-5a1e-2e9a-39c86caef504
export VAULT_ADDR='http://127.0.0.1:8200'
```

In production this would be done on a _different_ machine (or potentially a Vault cluster) and with more unseal keys, etc..

## Clone, Configure, Run

```bash
git clone https://github.com/tolitius/gblog
cd gblog
```

### Write creds to Vault

```bash
vault write secret/postgres @creds     ## this way creds don't go to the shell history
```

At this point the file `creds` can be deleted.
The reason we did it via file is not to leave creds traces in bash/shell history.

### Two step config

```bash
vi .env
```
```bash
## env for postgres
VAULT_HOST=                                       ## <<< set to a vault host/ip accessible from a docker container
PGDATA=/var/lib/postgresql/data                   ## this is going to be mounted to
PG_HOST_DATA=./var/lib/postgres/data/pgdata       ## to this: change it to a more secure location if needed
PG_HOST_PORT=5432

## env for ghost blog
GHOST_HOST_DATA=./var/lib/ghost/blog              ## ghost root will be mounted to this. change it to a more secure location if needed
GHOST_HOST_PORT=2368
NODE_ENV=production
DATABASE_URL=postgres://ghost:CHANGE-ME-TOO-ghost-pass@$REPLACE_ME_HOST:5432     ## <<< replace creds. also the "$REPLACE_ME_HOST" with a docker host IP
## ^^^ waiting for https://github.com/TryGhost/Ghost/issues/7177
```

#### add `VAULT_HOST`
in this case, since vault is run on the same host, just set the host IP (the IP of the host you are typing this commands at)

#### replace `$REPLACE_ME_HOST` with a host IP 
in this demo case it would be the same IP as you set for the `VAULT_HOST`

if you are unsure what your host IP is, just ask:
```bash
sudo ./what-is-my-host-ip.sh
192.168.1.12                   ## this is an example output, your IP most likely will be different
```

### Running it

```bash
export ACCESS_TOKEN=$(vault read -wrap-ttl=600s -field=wrapping_token secret/postgres | cat); \
docker-compose up
```

notice we are using Vault to create a temp token that is passed to docker containers.

Ghost running on PostgreSQL is up and ready for you: [http://localhost:2368/](http://localhost:2368/)

## Ghost creds are still in clear!?

Yes, I know, and opened an [issue](https://github.com/TryGhost/Ghost/issues/7177) which, once solved, will allow to read Ghost creds from Vault as well.

## What's next

> nginx will follow...

## License

Copyright © 2016 tolitius

Distributed under the Eclipse Public License either version 1.0 or (at
your option) any later version.
