import {readdir} from 'node:fs/promises'
import {join, dirname} from 'node:path'
import {chdir, cwd} from 'process'
import {spawnSync} from 'child_process'

const walk = async (dirPath) => Promise.all(
  await readdir(dirPath, { withFileTypes: true }).then((entries) => entries.map((entry) => {
    const childPath = join(dirPath, entry.name)
    if(entry.isDirectory()){
      return walk(childPath);
    }else if(entry.name === "package-lock.json"){
      return childPath;
    }else{
      return null;
    }
  }).filter(i => i !== null)),
)

const allFiles = await walk('/package-locks-dir');
const packageLockList = allFiles.flat(Number.POSITIVE_INFINITY);
const currentDir = cwd();
for(const packageLockPath of packageLockList){
  try{
    const packageLockDir = dirname(packageLockPath);
    chdir(packageLockDir);
    const ret = spawnSync("npm", ["ci", "--registry", "http://verdaccio:4873"]);
    if(ret.status !== 0){
      console.log(`ERROR: ${packageLockDir}`);
      console.log(ret.stdout.toString());
      console.log(ret.stderr.toString());
    }else{
      console.log(`SUCCESS: ${packageLockDir}`);
      console.log(ret.stdout.toString());
      console.log(ret.stderr.toString());
    }
  }catch(e){
    console.log(`EXCEPTION: ${e}`);
  }finally{
    chdir(currentDir);
  }
}
