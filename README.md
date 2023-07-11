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