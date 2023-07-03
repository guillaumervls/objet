import { dotenv } from "../deps.ts";

const envConfig = await dotenv.load();

const config = {
  dataDir: envConfig.OBJET_DATA_DIR,
};

export default config;
