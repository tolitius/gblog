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
will show the vault's logs:

>_export VAULT_ADDR='http://0.0.0.0:8200'_

>_..._

>_Root Token: 75de9b20-16fa-5a1e-2e9a-39c86caef504_


we would need 2 pieces of data from the above, to export a root token and a host address:

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

### One step config

Open `.env` file, and since Vault is running on the _same host_ in this case, set `VAULT_HOST` to the _host IP_.

> if you are unsure what your host IP is, just ask
```bash
./tools/what-is-my-host-ip.sh
192.168.1.12                    ## this is an example output, your IP most likely will be different
```

Pretending `192.168.1.12` is your host IP, a `VAULT_HOST` would look like:

```properties
VAULT_HOST=192.168.1.12
```

### Write creds to Vault

```bash
./tools/vault/vault-write.sh /secret/postgres config/creds
```

At this point the file `./config/creds` can be deleted.
The reason we did it via file (rather than providing creds in clear) is not to leave creds traces in bash/shell history.

You can check whether the creds were successfully written to Vault:

```bash
./tools/vault/vault-read.sh /secret/postgres
```
```json
{"ghost-pass": "CHANGE-ME-TOO-ghost-pass",
 "ghost-user": "ghost",
 "root-pass": "CHANGE-ME-root-pass",
 "root-user": "postgres"}
```

> _NOTE: for these vault scripts to work you would need [jq](https://stedolan.github.io/jq/) (i.e. to parse JSON responses from Vault)._

> _`brew install jq` or `apt-get install jq` or similar_

### Running it

```bash
export ACCESS_TOKEN=$(./tools/vault/wrap-token.sh /secret/postgres); docker-compose up
```

notice we are using Vault to create a temp token (wrapping our "secret") that is passed to docker containers.

Ghost running on PostgreSQL is up and ready for you: [http://localhost:2368/](http://localhost:2368/)

## Ghost creds are still in clear!?

Yes, I know, and opened an [issue](https://github.com/TryGhost/Ghost/issues/7177) which, once solved, will allow to read Ghost creds from Vault as well.

## What's next

> nginx will follow...

## License

Copyright © 2016 tolitius

Distributed under the Eclipse Public License either version 1.0 or (at
your option) any later version.
