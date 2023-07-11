# Offline NPM

The purpose of this repository is as follows:

> Given a directory, search and find all of the `package-lock.json` files present. Once these files have been discovered, `npm ci` them such that their dependencies are cached into verdaccio and subsequently can be used to stand up that verdaccio instance offline as a stand-in for NPM.

# Usage

Config is accomplished via the following environment variables specified in the `.env` file:
* `HOST_PACKAGE_LOCKS_DIR`: Absolute path to a directory on the host machine. This directory will be recursively searched for package-lock.json files. It is expected that each of these package-lock.json files is adjacent to a corresponding package.json file. Once each of these have been identified, the specified dependency packages will be installed with the verdaccio instance specified as the registry, thus causing the packages to be cached there.
* `HOST_VERDACCIO_DIR`: Absolute path to a directory on the host machine. This directory will be used by the verdaccio instance as storage and is where it stores its created cache of packages.

Thus a simple usage would be:
```
# 1. Modify values in .env file

# 2. Run the following:

docker compose up --build --force-recreate --abort-on-container-exit -t 60

# 3. Once the above exits, the contents of HOST_VERDACCIO_DIR are the cached packages.

# 4. Subsequently, copying that directory to an offline environment and specifying it as verdaccios "VERDACCIO_STORAGE_PATH" should cause those packages to be available.

docker run -e VERDACCIO_STORAGE_PATH=/verdaccio-storage -v $HOST_VERDACCIO_DIR:/verdaccio-storage -p 4873:4873 verdaccio/verdaccio

npm install --registry=http://localhost:4873 ...
```

## Running Verdaccio in Place of registry.npmjs.org in an Offline Environment

I did some experimentation with how to accomplish this. To do so I did the following:
* Added an entry in `/etc/hosts`
```
127.0.0.1       registry.npmjs.org
```
* Created local self signed certs per the instructions here: https://verdaccio.org/docs/ssl/, and specified `registry.npmjs.org` as the CN/FQDN.
* Added the cert to my local store by following these instructions: https://superuser.com/a/455714
* Copied the default config out of the verdaccio image and modified the following section (modified config file is included at ./verdaccio-conf/config.yaml):
```
https:
  key: /ssl-certs/verdaccio-key.pem
  cert: /ssl-certs/verdaccio-cert.pem
  ca: /ssl-certs/verdaccio-csr.pem
```
* Ran verdaccio using the following command:
```
docker run -e VERDACCIO_PORT=443 -e VERDACCIO_PROTOCOL=https -e VERDACCIO_STORAGE_PATH=/verdaccio-storage -v $HOST_VERDACCIO_DIR:/verdaccio-storage -v $(readlink -f ./ssl-certs):/ssl-certs -v $(readlink -f ./verdaccio-conf):/verdaccio/conf -p 443:443 verdaccio/verdaccio
```
* Confirmed that the cert was trusted by successfully executing `curl https://registry.npmjs.org` without needing to use `-k`
* However, after all this, npm was failing to install packages. It would sort of start and then it would just hang there.
* I confirmed that it was not a "logical" disconnect with verdaccio by disabling https in this full scenario and seeing that it succeeded in that case.
* **Then I found that npm apparently does not respect system CA settings, but comes bundled with it's own** (https://stackoverflow.com/a/27997570/2883500)

> Unfortunately npm's CA bundle is not editable as it's provided in the source code

* This was confirmed to be the issue because after executing:
```
npm config set cafile /home/kpoole/offline-npm/ssl-certs/verdaccio-cert.pem
```
* ...then npm install commands started working.