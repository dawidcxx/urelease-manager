import 'dotenv/config'
import { createServer } from './createServer'
import { getEnv, mapOptional } from './util'

await createServer({
    rootDir: getEnv("SCAN_DIR"),
    dbUrl: getEnv("DB_FILE_NAME"),
    port: mapOptional(getEnv('RELEASE_MANAGER_PORT'), it => parseInt(it))
})